const axios = require('axios');
const fs = require('fs');

const encodedKey = 'ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D';
const cityCode = '35370'; // 고창군
const targetNodeId = 'TSB318000118';
const outputFile = 'routes_passing_node.json';

// 전체 노선 목록 가져오기
async function getAllRoutes(cityCode) {
    const url = `http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getBusRouteList?serviceKey=${encodedKey}&_type=json&cityCode=${cityCode}`;
    try {
        const res = await axios.get(url);
        const items = res.data?.response?.body?.items?.item;
        return Array.isArray(items) ? items : (items ? [items] : []);
    } catch (err) {
        console.error("노선 목록 조회 실패:", err.message);
        return [];
    }
}

// 각 노선의 정류장 목록 가져오기
async function getStationsOfRoute(routeId) {
    const url = `http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteAcctoThrghSttnList?serviceKey=${encodedKey}&_type=json&routeId=${routeId}`;
    try {
        const res = await axios.get(url);
        const items = res.data?.response?.body?.items?.item;
        return Array.isArray(items) ? items : (items ? [items] : []);
    } catch (err) {
        return [];
    }
}

async function findRoutesPassingNode() {
    const allRoutes = await getAllRoutes(cityCode);
    console.log("전체 노선 수: %d", allRoutes.length);

    const passingRoutes = [];

    for (const route of allRoutes) {
        const stations = await getStationsOfRoute(route.routeid);
        const match = stations.find(st => st.nodeid === targetNodeId);
        if (match) {
            console.log("노선번호 %s (ID: %s)가 정류장 %s 경유", route.routeno, route.routeid, targetNodeId);
            passingRoutes.push({
                routeno: route.routeno,
                routeid: route.routeid,
                routetp: route.routetp
            });
        }
    }

    console.log("총 %d개 노선이 정류장 %s을 경유합니다.", passingRoutes.length, targetNodeId);
    fs.writeFileSync(outputFile, JSON.stringify(passingRoutes, null, 2));
    console.log("%s 저장 완료", outputFile);
}

findRoutesPassingNode();

