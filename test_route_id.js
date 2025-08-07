const axios = require('axios');

const SERVICE_KEY = "ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D";
const CITY_CODE = "35370";

// 테스트할 routeId (예: 노선 213)
const routeId = "TSB318000116";

const url = `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteInfoIem` +
            `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&routeId=${routeId}&_type=json`;

axios.get(url)
  .then(res => {
    console.log("정상 응답 수신됨:");
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error("요청 실패:");
    if (err.response) {
      console.error("HTTP 상태코드:", err.response.status);
      console.error("응답 내용:\n", err.response.data);
    } else {
      console.error(err.message);
    }
  });

