const axios = require('axios');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname + '/public'));

const PORT = 3118;
const SERVICE_KEY = "여기에_본인_서비스키";
const CITY_CODE = "35370"; // 고창군
const NODE_ID = "TSB318000118"; // 고창중
const TARGET_ROUTE_NOS = ["189", "208", "213", "261", "301", "323", "358"];
const CACHE_FILE = "route_info_cache.json";

// 현재 HHMM 반환
function getCurrentTimeHHMM() {
  const now = new Date();
  return parseInt(now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0'), 10);
}

// 오늘 날짜
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

// 캐시 파일 불러오기
function loadRouteInfoCache() {
  try {
    const json = fs.readFileSync(CACHE_FILE, 'utf8');
    const data = JSON.parse(json);
    if (data.date !== getTodayDate()) {
      console.log("캐시 만료됨 → 새로 로딩 예정");
      return { date: getTodayDate(), data: {} };
    }
    return data;
  } catch (e) {
    console.log("캐시 없음 또는 손상 → 새로 생성 예정");
    return { date: getTodayDate(), data: {} };
  }
}

// 캐시 파일 저장
function saveRouteInfoCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error("캐시 저장 실패:", e.message);
  }
}

// 노선 리스트 조회
async function fetchRoutesAtStation() {
  const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnThrghRouteList` +
              `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&nodeid=${NODE_ID}` +
              `&_type=json&numOfRows=100&pageNo=1`;
  const response = await axios.get(url);
  const items = response.data?.response?.body?.items?.item;
  return Array.isArray(items) ? items : (items ? [items] : []);
}

// 노선 상세정보 조회
async function fetchRouteInfo(routeId) {
  const url = `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteInfoIem` +
              `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&routeId=${routeId}&_type=json`;
  const response = await axios.get(url);
  return response.data?.response?.body?.items?.item || null;
}

// 캐시로부터 조회 또는 API 호출
async function getCachedRouteInfo(routeId, cache) {
  if (cache.data[routeId]) return cache.data[routeId];
  const info = await fetchRouteInfo(routeId);
  if (info) {
    cache.data[routeId] = info;
    saveRouteInfoCache(cache);
  }
  return info;
}

// 도착 정보 조회
async function fetchArrivalInfo(routeId) {
  const url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList` +
              `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&nodeId=${NODE_ID}&routeId=${routeId}&_type=json`;
  const response = await axios.get(url);
  const items = response.data?.response?.body?.items?.item;
  return Array.isArray(items) ? items : (items ? [items] : []);
}

// 실시간 버스 도착 정보 갱신
async function updateBusInfos() {
  try {
    const nowHHMM = getCurrentTimeHHMM();
    const routes = await fetchRoutesAtStation();
    const cache = loadRouteInfoCache();
    const targetRoutes = routes.filter(r => TARGET_ROUTE_NOS.includes(String(r.routeno)));

    for (const routeNo of TARGET_ROUTE_NOS) {
      const route = targetRoutes.find(r => String(r.routeno) === routeNo);

      if (!route) {
        const msg = "해당 노선이 이 정류장을 경유하지 않음";
        console.log("[%s] %s", routeNo, msg);
        io.emit(routeNo, msg);
        continue;
      }

      const routeId = route.routeid;
      const routeInfo = await getCachedRouteInfo(routeId, cache);

      if (!routeInfo) {
        const msg = "상세 정보 조회 실패";
        console.log("[%s] %s", routeNo, msg);
        io.emit(routeNo, msg);
        continue;
      }

      const first = parseInt(routeInfo.startvehicletime || "0000", 10);
      const last = parseInt(routeInfo.endvehicletime || "0000", 10);
      const isRunning = nowHHMM >= first && nowHHMM <= last;

      if (!isRunning) {
        const msg = "운행 종료";
        console.log("[%s] %s", routeNo, msg);
        io.emit(routeNo, msg);
        continue;
      }

      const arrivals = await fetchArrivalInfo(routeId);

      if (!arrivals || arrivals.length === 0 || !arrivals[0]) {
        const msg = "도착 정보 없음";
        console.log("[%s] %s", routeNo, msg);
        io.emit(routeNo, msg);
      } else {
        const info = arrivals[0];
        const arrtime = info.arrtime || "정보 없음";
        const stationcnt = info.arrprevstationcnt || "정보 없음";
        const vehicle = info.vehicletp || "정보 없음";
        const msg = "%s초 후 도착 (%s개 정류장 남음), 차량: %s" % [arrtime, stationcnt, vehicle];
        console.log("[%s] %s", routeNo, msg);
        io.emit(routeNo, msg);
      }

      await new Promise(res => setTimeout(res, 300));
    }
  } catch (err) {
    console.error("오류 발생: %s", err.message);
  }
}

setInterval(updateBusInfos, 10000); // 10초마다 갱신
server.listen(PORT, () => {
  console.log('listening on *:' + PORT);
});

