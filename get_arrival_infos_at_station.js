const axios = require('axios');

const SERVICE_KEY = "여기에_본인_서비스키";
const CITY_CODE = "35370";
const NODE_ID = "TSB318000513"; // 고창중 정류장
const TARGET_ROUTE_NOS = ["189", "206", "213", "261", "301", "323", "358"];

// 숫자만 남기고 노선번호 정규화 (예: "261-1" → "2611")
function normalizeRouteNo(rawNo) {
  return String(rawNo).replace(/[^0-9]/g, '');
}

// 현재 HHMM 시간 반환
function getCurrentTimeHHMM() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return parseInt(hh + mm, 10);
}

// 고창군 전체 노선 목록 가져와 routeNo → routeId 매핑
async function fetchAllRoutesInCity() {
  const url = `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteNoList` +
              `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&_type=json&numOfRows=300&pageNo=1`;

  const response = await axios.get(url);
  const items = response.data?.response?.body?.items?.item;
  if (!items) return {};
  const list = Array.isArray(items) ? items : [items];

  const map = {};
  for (const r of list) {
    const no = normalizeRouteNo(r.routeno);
    if (TARGET_ROUTE_NOS.includes(no)) {
      map[no] = r.routeid;
    }
  }

  return map;
}

// 정류장 경유 노선 목록 조회
async function fetchRoutesAtStation() {
  const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnThrghRouteList` +
              `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&nodeid=${NODE_ID}` +
              `&_type=json&numOfRows=100&pageNo=1`;

  const response = await axios.get(url);
  const items = response.data?.response?.body?.items?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

// 노선 상세 정보 조회
async function fetchRouteInfo(routeId) {
  const url = `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteInfoIem` +
              `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&routeId=${routeId}&_type=json`;

  const response = await axios.get(url);
  return response.data?.response?.body?.items?.item || null;
}

// 도착 정보 조회
async function fetchArrivalInfo(routeId) {
  const url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList` +
              `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&nodeId=${NODE_ID}&routeId=${routeId}&_type=json`;

  const response = await axios.get(url);
  const items = response.data?.response?.body?.items?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

// 실행 메인
async function main() {
  try {
    const nowHHMM = getCurrentTimeHHMM();

    // 전체 노선에서 실제 routeId 매핑 확보
    const routeIdMap = await fetchAllRoutesInCity();

    // 정류장 경유 노선 조회
    const stationRoutes = await fetchRoutesAtStation();
    const availableRoutes = stationRoutes.filter(r =>
      TARGET_ROUTE_NOS.includes(normalizeRouteNo(r.routeno))
    );

    if (availableRoutes.length === 0) {
      console.log("대상 노선이 해당 정류장을 경유하지 않습니다.");
      return;
    }

    const checked = new Set();

    for (const r of availableRoutes) {
      const routeNo = normalizeRouteNo(r.routeno);
      if (checked.has(routeNo)) continue;
      checked.add(routeNo);

      const routeId = routeIdMap[routeNo];
      if (!routeId) {
        console.log("노선 %s: routeId 매핑 실패 (정류장 routeId: %s)", routeNo, r.routeid);
        continue;
      }

      const routeInfo = await fetchRouteInfo(routeId);
      if (!routeInfo) {
        console.log("노선 %s (%s): 상세정보 조회 실패", routeNo, routeId);
        continue;
      }

      const first = parseInt(routeInfo.startvehicletime || "0000", 10);
      const last = parseInt(routeInfo.endvehicletime || "0000", 10);
      const isRunning = nowHHMM >= first && nowHHMM <= last;

      console.log("노선번호: %s", routeNo);
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
      await new Promise(resolve => setTimeout(resolve, 300)); // API 과호출 방지
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

