const axios = require('axios');

const SERVICE_KEY = "ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D";
const CITY_CODE = "35370";
const NODE_ID = "TSB318000513"; // 고창중 정류장
const RAW_TARGET_ROUTE_NOS = ["189", "206", "213", "261", "301", "323", "358"];

// 노선번호 숫자만 추출
function normalizeRouteNo(no) {
  return String(no).replace(/[^0-9]/g, '');
}
const TARGET_ROUTE_NOS = RAW_TARGET_ROUTE_NOS.map(normalizeRouteNo);

// 현재 HHMM 시간 반환
function getCurrentTimeHHMM() {
  const now = new Date();
  return parseInt(now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0'), 10);
}

// 정류장을 경유하는 전체 노선 조회
async function fetchRoutesAtStation() {
  const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnThrghRouteList?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&nodeid=${NODE_ID}&_type=json&numOfRows=100&pageNo=1`;
  const response = await axios.get(url);
  const items = response.data?.response?.body?.items?.item;
  return Array.isArray(items) ? items : [items];
}

// 노선 상세정보 조회
async function fetchRouteInfo(routeId) {
  const url = `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteInfoIem?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&routeId=${routeId}&_type=json`;
  const response = await axios.get(url);
  return response.data?.response?.body?.items?.item || null;
}

// 도착정보 조회
async function fetchArrivalInfo(routeId) {
  const url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&nodeId=${NODE_ID}&routeId=${routeId}&_type=json`;
  const response = await axios.get(url);
  const items = response.data?.response?.body?.items?.item;
  return Array.isArray(items) ? items : [items];
}

// 메인 실행
async function main() {
  try {
    const nowHHMM = getCurrentTimeHHMM();
    const stationRoutes = await fetchRoutesAtStation();

    if (!stationRoutes || stationRoutes.length === 0) {
      console.log("정류장에서 운행되는 노선을 찾을 수 없습니다.");
      return;
    }

    const checked = new Set();

    for (const r of stationRoutes) {
      const rawNo = r.routeno;
      const normNo = normalizeRouteNo(rawNo);

      if (!TARGET_ROUTE_NOS.includes(normNo)) continue;
      if (checked.has(normNo)) continue;
      checked.add(normNo);

      const routeId = r.routeid;  // ← 여기 핵심 변경!

      const routeInfo = await fetchRouteInfo(routeId);
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

