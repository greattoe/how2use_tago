const axios = require('axios');

const SERVICE_KEY = "여기에_본인_서비스키";
const CITY_CODE = "35370";  // 고창군
const NODE_ID = "TSB318000118";  // 조회 대상 정류소 ID TSB318001052

async function fetchRoutesAtStation() {
  const url = "https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnThrghRouteList" +
              "?serviceKey=" + SERVICE_KEY +
              "&cityCode=" + CITY_CODE +
              "&nodeid=" + NODE_ID +
              "&_type=json" +
              "&numOfRows=100&pageNo=1";

  try {
    const response = await axios.get(url);
    const items = response.data?.response?.body?.items?.item;

    if (!items) {
      console.log("정류장을 경유하는 노선이 없습니다.");
      return;
    }

    const routes = Array.isArray(items) ? items : [items];
    const stationName = routes[0].nodenm || "알 수 없음";

    console.log("정류장 ID: %s (%s)", NODE_ID, stationName);
    console.log("총 경유 노선 수: %d\n", routes.length);

    routes.forEach((route, idx) => {
      console.log("[%d] 노선번호: %s", idx + 1, route.routeno);
    });

  } catch (err) {
    console.error("API 호출 오류: %s", err.message);
    if (err.response) {
      console.error("응답 코드: %d", err.response.status);
      console.error("응답 본문:\n%s", err.response.data);
    }
  }
}

fetchRoutesAtStation();

