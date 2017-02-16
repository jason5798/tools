var moment = require('moment');
var ParseBlaziong =  require('./parseBlaziong.js');
var ParseDefine =  require('./parseDefine.js');
var overtime = 24;
var hour = 60*60*1000;
var mac_tag_map = {};
var type_tag_map = {};
var type_time_map = {};
var mData,mMac,mRecv,mDate,mTimestamp,mType,mExtra ;
//Jason add for filter delay message on 2017.02.15
var mac_time_map = {};
var startTime = 0;

exports.parseMsg = function (msg) {
    
    if(getType(msg) != 'object'){
        try {
			msg = JSON.parse(msg.toString());
		}
		catch (e) {
			console.log('msgTools parse json error message #### drop :'+e.toString());
			return null;
		}
    }
    //Get data attributes
    mData = msg.data;
    mType = mData.substring(0,4);
    mMac  = msg.macAddr;
    mRecv = msg.recv;
    mDate = moment(msg.recv).format('YYYY/MM/DD HH:mm:ss');
    mTimestamp = moment(msg.recv);
    mExtra = msg.extra;
    var arrCpmpare =  mac_time_map[mMac];

    if ( arrCpmpare === undefined){
        mac_time_map[mMac] = [];//Define map data is array
        arrCpmpare = [];
    }
    
    //Check overtime - start
    var now = new Date().getTime();
    
    if(( (now - startTime) / hour ) > overtime ){
        //Reset every day startTime and compare array
        console.log( '#### (now - startTime) / hour > '+ overtime + ' reset every day startTime and compare array');
        var start = new Date();
        start.setHours(0,0,0,0);
        //console.log( start.toUTCString());
        startTime = start.getTime();
        mac_time_map[mMac] = [];
        mac_time_map[mMac].push(mDate);
    }else{
         //console.log( arrCpmpare.indexOf('test') );
         //Filter repeat date message
         if( arrCpmpare.indexOf(mDate) != -1){
             console.log('#### mac: '+mMac+',date =' + mDate +'is repeat  drop');
             return null;
         }else{
             mac_time_map[mMac].push(mDate);
         }
    }
    

    /*var result = (now - mTimestamp)/hour;
    var mInfo = {};
    console.log('now : '+ now + ', recvTime : '+ mTimestamp  + ', result : '+ result);

    if(  result > overtime ){
        console.log('mac: '+mMac+',date =' + mDate +'is overtime #### drop');
		return null;
	}*/
    //Check overtime - end
    delete mExtra.gwip;
    delete mExtra.repeater;
    delete mExtra.systype;
    //Check tag
    if(isSameTagCheck(mType,mMac,msg.recv)){
        return null;
    }else if(mType.indexOf('aa')!=-1){
        mInfo = parseDefineMessage(mData,mType);
    }else if(mExtra.fport){
        mInfo = parseBlazingMessage(mData,extra.fport);
    }
    var msg = {mac:mMac,data:mData,recv:mRecv,date:mDate,extra:mExtra,information:mInfo,timestamp:mTimestamp,type:mType};
    return msg;
}

function parseDefineMessage(data){
   var mInfo = ParseDefine.getInformation(data);
   return mInfo;
}

function parseBlazingMessage(data,fport){
    mType = data.substring(0,4);
     ;
    var mInfo = {};
    
    //for blazing
    if(fport === 3 || fport === 1){//GPS
        mInfo = ParseBlaziong.getTracker(data);
    }else if(fport === 19){//PIR
        mInfo = ParseBlaziong.getPIR(data);
    }else if(fport === 11){//PM2.5
        mInfo = ParseBlaziong.getPM25(data);
    }else if(fport === 21){//Flood
        mInfo = ParseBlaziong.getFlood(data);
    }
    return mInfo;
}

//type_tag_map is local JSON object
function isSameTagCheck(type,mac,recv){
	var time =  moment(recv).format('mm');
	
	//Get number of tag
	var tmp = mData.substring(4,6);
	var mTag = parseInt(tmp,16)*100;//流水號:百位
        mTag = mTag + parseInt(time,10);//分鐘:10位及個位
	var key = mac.concat(type);
	var tag = type_tag_map[key];

	if(tag === undefined){
		tag = 0;
	}

	/* Fix 時間進位問題
		example : time 由59分進到00分時絕對值差為59
	*/
	if (Math.abs(tag - mTag)<2 || Math.abs(tag - mTag)==59){
		console.log('#### mTag=' +mTag+'(key:' +key + '):tag='+tag+'  drop');
		return true;
	}else{
		type_tag_map[key] = mTag;
		console.log('**** mTag=' +mTag+'(key:' +key + '):tag='+tag +'=>'+mTag+' save' );
		return false;
	}
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

