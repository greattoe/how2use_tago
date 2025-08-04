const axios = require('axios');

const SERVICE_KEY = "ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D";
const TARGET_NODE_ID = "TSB318000117";

// 고창 터미널 주변 대략적 좌표 기준으로 넓게 탐색
const LAT = 35.425063;
const LNG = 126.699997;
const RADIUS = 2000;  // 단위: 미터

async function fetchStationByNodeId() {
  const url = "https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList" +
              "?serviceKey=" + SERVICE_KEY +
              "&gpsLati=" + LAT +
              "&gpsLong=" + LNG +
              "&radius=" + RADIUS +
              "&_type=json";

  try {
    const response = await axios.get(url);
    const items = response.data?.response?.body?.items?.item;

    if (!items) {
      console.log("검색 반경 내에 정류장이 없습니다.");
      return;
    }

    const stations = Array.isArray(items) ? items : [items];
    const target = stations.find(stn => stn.nodeid === TARGET_NODE_ID);

    if (!target) {
      console.log("해당 nodeid (%s)를 반경 %d m 내에서 찾을 수 없습니다.", TARGET_NODE_ID, RADIUS);
      return;
    }

    console.log("정류장명: %s", target.nodenm);
    console.log("정류장 ID: %s", target.nodeid);
    console.log("위도: %s", target.gpslati);
    console.log("경도: %s", target.gpslong);
  } catch (err) {
    console.error("API 호출 오류: %s", err.message);
    if (err.response) {
      console.error("응답 코드: %d", err.response.status);
      console.error("응답 본문:\n%s", err.response.data);
    }
  }
}

fetchStationByNodeId();

