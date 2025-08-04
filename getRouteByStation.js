const axios = require('axios');
const fs = require('fs');

// 인코딩된 서비스 키
const encodedKey = 'ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D';

// 조회할 정류장 ID
const nodeId = 'TSB318000118';

const url = `http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteByStation` +
            `?serviceKey=${encodedKey}&_type=json&nodeId=${nodeId}`;

async function getRoutesByStation() {
    try {
        const res = await axios.get(url, {
            headers: { Accept: 'application/json' }
        });

        const items = res.data?.response?.body?.items?.item;
        if (!items) {
            console.log("정류장을 경유하는 노선이 없습니다. 응답:\n", JSON.stringify(res.data, null, 2));
            return;
        }

        const routeList = Array.isArray(items) ? items : [items];

        console.log("정류장 ID %s 를 지나는 노선 수: %d\n", nodeId, routeList.length);
        routeList.forEach((route, idx) => {
            console.log("%d: 노선번호: %s / 노선ID: %s / 노선유형: %s", idx + 1, route.routeno, route.routeid, route.routetp);
        });

        fs.writeFileSync(`routes_by_${nodeId}.json`, JSON.stringify(routeList, null, 2), 'utf8');
        console.log(`\nroutes_by_${nodeId}.json 저장 완료`);

    } catch (err) {
        if (err.response) {
            console.error("응답 오류:\n", err.response.data);
        } else {
            console.error("요청 실패: %s", err.message);
        }
    }
}

getRoutesByStation();

