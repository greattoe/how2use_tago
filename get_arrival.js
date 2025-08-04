var request=require("request")
var cheerio=require("cheerio")

var defaultUrl="http://openapi.gbis.go.kr/ws/rest/busarrivalservice/station"  //정류소 조회 REST Api url
const SERVICE_KEY="CHECK THIS OUT"   //!!!꼭 서비스키 자기꺼로 수정해서 쓰셔야합니다.
var keyword="203000125"  //query로 던져지는 인자, getStationId에서 얻은 정류소 id를 넣어주면 됨.

//버스 도착 정보의 routeId를 routeName으로 바꾸기도 해주는 작업
function routeIdToName(routeId){

    //routeId를 통해 버스 정보를 얻는 REST api를 이용해 그 정보 중 버스 이름을 빼올 것임
    //request 모듈은 async하기 때문에 Promise를 이용해야한다.
    //예를 들어 routeId를 얻었고 그것을 이 routeIdToName 함수를 이용해 routeName으로 정리한 뒤
    //predictTime과 정리해서 출력하고 싶은데 Promise를 이용하지 않으면
    //routeIdToName 함수가 백그라운드에서 작업하는 와중에 이미 출력은 되고 있기 때문에
    //undefined 혹은 Promise pending 등으로 값이 입력될 것이다..
    //Promise가 낯설면 좀 어려울 수도 ㅎㅎ.......
    return new Promise( (resolve)=>{

        //url은 버스노선조회 서비스의 노선정보항목조회 api url임.
        request("http://openapi.gbis.go.kr/ws/rest/busrouteservice/info"+"?serviceKey="+SERVICE_KEY+"&routeId="+routeId, function(err, res, body){
            var $=cheerio.load(body)
            resolve($("routeName").text())
        })
    })
}

//getBusAriivalsOnlyRouteId와 비슷한데
//버스 도착정보의 routeId를 routeName으로 변환까지 한 뒤 출력해주는 작업
request(defaultUrl+"?serviceKey="+SERVICE_KEY+"&stationId="+keyword, function(err, res, body){
    var $=cheerio.load(body)

    // 각각 버스 도착 정보는 busArrivalList 태그 안에 들어있음
    // 따라서 each문 이용
    $("busArrivalList").each(function(index, bus){
        // bus 변수를 context로 주어서 선택자 이용

        // Promise와 then을 이용해 깔끔하게 표현
        routeIdToName($('routeId', bus).text())
            .then(function(routeName){
                console.log("=====================")
                console.log("routeName : "+routeName)
                console.log($('predictTime1', bus).text()+" mins left  "+$('predictTime2', bus).text()+" mins left")
                console.log("=====================")
            })
    })
})
