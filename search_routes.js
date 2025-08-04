const axios = require('axios');

const encodedKey = 'ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D';

async function getAllRoutes(cityCode) {
    const url = `http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getBusRouteList?serviceKey=${encodedKey}&_type=json&cityCode=${cityCode}`;

    try {
        const res = await axios.get(url, {
            headers: { Accept: 'application/json' }
        });

        const items = res.data?.response?.body?.items?.item;
        if (!items) {
            console.error("노선 정보 없음:\n", JSON.stringify(res.data, null, 2));
            return;
        }

        const routes = Array.isArray(items) ? items : [items];
        routes.forEach((route, idx) => {
            console.log("%d: 노선번호: %s / 노선ID: %s / 노선유형: %s / 운행사: %s",
                idx + 1, route.routeno, route.routeid, route.routetp, route.companyname);
        });

        console.log("\n총 %d개 노선", routes.length);

    } catch (err) {
        if (err.response) {
            console.error("응답 오류:\n", err.response.data);
        } else {
            console.error("요청 실패: %s", err.message);
        }
    }
}

// 예: 고창군 (35370)
getAllRoutes('35370');

