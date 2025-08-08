const int pinCooler = 10;
const int pinHeater = 13;

String rcv_str = "";         // a String to hold recieving data
bool stringComplete = false;  // whether the string is complete

void setup() {
  rcv_str.reserve(20);
  pinMode(pinCooler, OUTPUT); digitalWrite(pinCooler, LOW);
  pinMode(pinHeater, OUTPUT); digitalWrite(pinHeater, LOW);
  Serial.begin(9600);
  Serial.println("smart bus station");
}

void loop() {
  if(Serial.available() > 0){
    char ch = Serial.read();
    if(ch != '\n'){
      rcv_str = rcv_str + ch;
    }
    else {
      Serial.println(rcv_str);
      /***********************************************************/
      if(rcv_str.substring(0,4) == "cool"){
        if(rcv_str.substring(4,5) == "1") digitalWrite(pinCooler, HIGH);
        else if(rcv_str.substring(4,5) == "0") digitalWrite(pinCooler, LOW);
      }
      else if(rcv_str.substring(0,4) == "heat"){
        if(rcv_str.substring(4,5) == "1") digitalWrite(pinHeater, HIGH);
        else if(rcv_str.substring(4,5) == "0") digitalWrite(pinHeater, LOW);
      }
      /***********************************************************/
      rcv_str = "";
    }
  }
}
