const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SERVICE_KEY = "ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D";
const CITY_CODE = "35370";
const NODE_ID = "TSB318000513";
const RAW_TARGET_ROUTE_NOS = ["189", "208", "213", "261", "301", "323", "358"];
const CACHE_FILE = "route_info_cache.json";

// 숫자만 추출
function normalizeRouteNo(no) {
  return String(no).replace(/[^0-9]/g, '');
}
const TARGET_ROUTE_NOS = RAW_TARGET_ROUTE_NOS.map(normalizeRouteNo);

// HHMM 형식 시간 반환
function getCurrentTimeHHMM() {
  const now = new Date();
  return parseInt(now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0'), 10);
}

// YYYY-MM-DD 반환
function getTodayDate() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

// 정류장을 경유하는 노선 조회
async function fetchRoutesAtStation() {
  const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnThrghRouteList?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&nodeid=${NODE_ID}&_type=json&numOfRows=100&pageNo=1`;
  const res = await axios.get(url);
  const items = res.data?.response?.body?.items?.item;
  return Array.isArray(items) ? items : [items];
}

// 노선 상세정보 API 호출
async function fetchRouteInfo(routeId) {
  const url = `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteInfoIem?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&routeId=${routeId}&_type=json`;
  const res = await axios.get(url);
  return res.data?.response?.body?.items?.item || null;
}

// 도착 정보
async function fetchArrivalInfo(routeId) {
  const url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&nodeId=${NODE_ID}&routeId=${routeId}&_type=json`;
  const res = await axios.get(url);
  const items = res.data?.response?.body?.items?.item;
  return Array.isArray(items) ? items : [items];
}

// 캐시 로딩
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
    console.log("캐시 파일 없음 또는 손상 → 새로 생성 예정");
    return { date: getTodayDate(), data: {} };
  }
}

// 캐시 저장
function saveRouteInfoCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error("캐시 저장 실패:", e.message);
  }
}

// 캐시에서 routeInfo 조회 또는 API 호출
async function getCachedRouteInfo(routeId, cache) {
  if (cache.data[routeId]) return cache.data[routeId];
  const info = await fetchRouteInfo(routeId);
  if (info) {
    cache.data[routeId] = info;
    saveRouteInfoCache(cache);
  }
  return info;
}

// 메인 실행
async function main() {
  try {
    const nowHHMM = getCurrentTimeHHMM();
    const routeInfoCache = loadRouteInfoCache();
    const stationRoutes = await fetchRoutesAtStation();

    const checked = new Set();

    for (const r of stationRoutes) {
      const rawNo = r.routeno;
      const normNo = normalizeRouteNo(rawNo);
      const routeId = r.routeid;

      if (!TARGET_ROUTE_NOS.includes(normNo)) continue;
      if (checked.has(normNo)) continue;
      checked.add(normNo);

      const routeInfo = await getCachedRouteInfo(routeId, routeInfoCache);
      if (!routeInfo) {
        console.log("노선 %s (%s): 상세정보 조회 실패", rawNo, routeId);
        continue;
      }

      const first = parseInt(routeInfo.startvehicletime || "0000", 10);
      const last = parseInt(routeInfo.endvehicletime || "0000", 10);
      const isRunning = nowHHMM >= first && nowHHMM <= last;

      console.log("노선번호: %s", rawNo);
      console.log("- 첫차시간: %s", String(first).padStart(4, '0'));
      console.log("- 막차시간: %s", String(last).padStart(4, '0'));
      console.log("- 현재시각: %s", String(nowHHMM).padStart(4, '0'));
      console.log("- 운행상태: %s", isRunning ? "운행 중" : "운행 종료");

      if (isRunning) {
        const arrivals = await fetchArrivalInfo(routeId);
        if (arrivals.length === 0) {
          console.log("  도착 정보 없음");
        } else {
          arrivals.forEach((info, idx) => {
            console.log("  [%d] %d초 후 도착 (%d개 정류장 남음), 차량: %s",
              idx + 1,
              info.arrtime,
              info.arrprevstationcnt,
              info.vehicletp || "정보 없음"
            );
          });
        }
      }

      console.log("--------------------------------------------------");
      await new Promise(resolve => setTimeout(resolve, 300));
    }

  } catch (err) {
    console.error("오류 발생: %s", err.message);
    if (err.response) {
      console.error("응답코드: %d", err.response.status);
      console.error("본문:\n%s", err.response.data);
    }
  }
}

main();

