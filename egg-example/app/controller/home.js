'use strict';

const Controller = require('egg').Controller;
const Papa = require('papaparse');
const path = require('path');
const fs = require('fs');
var pile = new Array();
var quickPile = new Array();    //快充分布
var slowPile = new Array();   //慢充分布
const maxInt = 1000000;
var folder = path.join(__dirname, '..', 'csv');

class HomeController extends Controller {
  async index() {
    this.ctx.body = 'hi, egg';
  }

  async calcResult() {
    const body = this.ctx.request.body;
    //const city = "Shanghai", sum=20000, ratio = 1, usage = 0.02;
    const city = body.city, sum=body.sum, ratio = body.ratio, usage = body.usage;

    var totalPile = 0;
    var square = new Array(); //格点信息
    var grid = new Array();   //网格坐标
    var gridClip = new Array();   //有效网格坐标
    var district = new Array();   //行政区划信息
    var totalQuickRate = new Array();   //快充功效函数
    var totalSlowRate = new Array();    //慢充功效函数

    var length_2 = [161007,71523];
    var length_5 = [403423,177793];
    var length_10 = [806551,35379];
    var event_2 = new Array();    //0.02对应事件数据
    var event_5 = new Array();    //0.05对应事件数据
    var event_10 = new Array();   //0.1对应事件数据

    var disPile = new Array();
    var disQuickPile = new Array();   //区划快充数量
    var disSlowPile = new Array();    //区划慢充数量
    var disQuickRate = new Array();   //区划快充功效函数
    var disSlowRate = new Array();    //区划慢充功效函数

    var currentQuickRate = maxInt;
    var currentSlowRate = maxInt;
    var totalQuickMissRate = 0,totalQuickFillRate = 0,totalSlowMissRate = 0, totalSlowFillRate = 0;
    var quickCount = 0, slowCount = 0;
    var count1 = new Array();
    var count2 = new Array();

    var quickCharge = new Array();
    var slowCharge = new Array();
    var quickChargingTime = new Array();    //快充总时间
    var slowChargingTime = new Array();    //慢充总时间
    var quickMiss = new Array();    //慢充不满足数
    var slowMiss = new Array();   //慢充不满足数
    var quickChargingEvent = new Array();   //快充总事件
    var slowChargingEvent = new Array();    //慢充总事件

    var quickOrder = new Array();
    var slowOrder = new Array();
    var districtName = ["崇明县","奉贤区","嘉定区","金山区","闵行区","浦东新区","浦东新区","青浦区","上海中心城区","松江区"]

    folder = path.join(__dirname, '..', 'csv/'+city);
    const dist = fs.readFileSync(path.join(folder, 'district.csv'), 'utf8');
    const gridall = fs.readFileSync(path.join(folder, 'gridall.csv'), 'utf8');
    const gridclip = fs.readFileSync(path.join(folder, 'gridclip.csv'), 'utf8');
    const density = fs.readFileSync(path.join(folder, 'density.csv'), 'utf8');
    const charevent_2 = fs.readFileSync(path.join(folder, 'charevent-2.csv'), 'utf8');
    const charevent_5 = fs.readFileSync(path.join(folder, 'charevent-5.csv'), 'utf8');
    const charevent_10 = fs.readFileSync(path.join(folder, 'charevent-10.csv'), 'utf8');

    init();

    Papa.parse(gridall, {
      complete: (results) => {
        var data = results.data, html;
        console.log(data.length);
        for(var i = 1, _l = data.length-1; i < _l; i++) {
          var item = data[i];
          grid[i-1] = new Object();
          grid[i-1].x = item[3];
          grid[i-1].y = item[4];
        }
      }
    });
    Papa.parse(dist, {
      complete: (results) => {
        var data = results.data, html;
        console.log(data.length);
        for(var i = 1, _l = data.length-1; i < _l; i++) {
          var item = data[i];
          district[i-1] = new Object();
          district[i-1].id = item[0];
          district[i-1].name = item[1];
          district[i-1].kind = item[2];
        }
      }
    });
    Papa.parse(gridclip, {
      complete: function(results) {
        var data = results.data, html;
        for(var i = 1, _l = data.length-1; i < _l; i++) {
          var item = data[i];
          gridClip[i-1] = new Object();
          gridClip[i-1].x = item[4];
          gridClip[i-1].y = item[5];
        }
      }
    });
    Papa.parse(density, {
      complete: (results) => {
        var data = results.data, html;
        console.log(data.length);
        for(var i = 1, _l = data.length-1; i < _l; i++) {
          var item = data[i];
          square[i-1] = new Object();
          square[i-1].longitude = item[1];
          square[i-1].latitude = item[2];
          square[i-1].kind = item[3];
          square[i-1].density = item[4];
        }
        Papa.parse(charevent_2, {
          complete: (results) => {
            var data = results.data, html;
            console.log(data.length);
            for(var i = 1, _l = data.length-1; i < _l; i++) {
              var item = data[i];
              event_2[i-1] = new Object();
              event_2[i-1].gridID = item[1];
              event_2[i-1].startTime = item[4];
              event_2[i-1].eventDur = Math.ceil(item[5]/3600);
            }
          }
        });
        Papa.parse(charevent_5, {
          complete: (results) => {
            var data = results.data, html;
            console.log(data.length);

            for(var i = 1, _l = data.length-1; i < _l; i++) {
              var item = data[i];
              event_5[i-1] = new Object();
              event_5[i-1].gridID = item[1];
              event_5[i-1].startTime = item[4];
              event_5[i-1].eventDur = Math.ceil(item[5]/3600);
            }
          }
        });
        Papa.parse(charevent_10, {
          complete: (results) => {
            var data = results.data, html;
            console.log(data.length);

            for(var i = 1, _l = data.length-1; i < _l; i++) {
              var item = data[i];
              event_10[i-1] = new Object();
              event_10[i-1].gridID = item[1];
              event_10[i-1].startTime = item[4];
              event_10[i-1].eventDur = Math.ceil(item[5]/3600);
            }
            calcPile();
            this.ctx.body = disPile;
          }
        });
      }
    });

    function init(){    //初始化
      /*for(var i=0;i<length;i++){
        square[i] = new Object();
      }

      for(var i=0;i<7296;i++){
        gridClip[i] = new Object();
      }
      for(var i=0;i<length;i++){
        district[i] = new Object();
      }*/
      for(var i=0;i<square.length;i++){
        totalQuickRate[i]=0;
        totalSlowRate[i]=0;
      }
      for(var i=0;i<square.length;i++) {
        pile[i] = 0;
        quickPile[i] = 0;
        slowPile[i] = 0;
      }
      /*for(var i=0;i<event_2.length;i++){
        event_2[i] = new Object();
      }
      for(var i=0;i<event_5.length;i++){
        event_5[i] = new Object();
      }
      for(var i=0;i<event_10.length;i++){
        event_10[i] = new Object();
      }*/
      for(var i=0;i<10;i++){
        disQuickPile[i] = 0;
        disSlowPile[i] = 0;
        disQuickRate[i] = 0;
        disSlowRate[i] = 0;
      }
      for(var i=0;i<10;i++) {
        count1[i] = 0;
        count2[i] = 0;
      }
    }

    function calcQuickRate(){ //计算总和
      var result = 0;
      for(var i=0;i<totalQuickRate.length;i++){
        result += Number(totalQuickRate[i]);
      }
      return result;
    }

    function calcSlowRate(){    //计算总和
      var result = 0;
      for(var i=0;i<totalSlowRate.length;i++){
        result += Number(totalSlowRate[i]);
      }
      return result;
    }


    function adjustQuickPile(){   //快充调整分布
      for(var i=0;i<totalQuickRate.length;i++){
        quickOrder[i] = i;
      }
      var count = 0;
      for(var i=0;i<totalQuickRate.length;i++){
        if(totalQuickRate[i] > 0)
          count++;
      }
      for(var i=0;i<totalQuickRate.length;i++){
        for(var j=i+1;j<totalQuickRate.length;j++){
          if(totalQuickRate[i]<totalQuickRate[j]){
            var temp1 = totalQuickRate[i];
            var temp2 = quickOrder[i];
            totalQuickRate[i] = totalQuickRate[j];
            quickOrder[i] = quickOrder[j];
            totalQuickRate[j] = temp1;
            quickOrder[j] = temp2;
          }
        }
      }
      for(var i=0;i<count/4;i++){
        quickPile[quickOrder[i]]--;
        quickPile[quickOrder[count-i]]++;
      }
    }

    function adjustSlowPile(){    //慢充调整分布
      for(var i=0;i<totalSlowRate.length;i++){
        slowOrder[i] = i;
      }
      var count = 0;
      for(var i=0;i<totalSlowRate.length;i++){
        if(totalSlowRate[i] > 0)
          count++;
      }
      for(var i=0;i<totalSlowRate.length;i++){
        for(var j=i+1;j<totalSlowRate.length;j++){
          if(totalSlowRate[i]<totalSlowRate[j]){
            var temp1 = totalSlowRate[i];
            var temp2 = slowOrder[i];
            totalSlowRate[i] = totalSlowRate[j];
            slowOrder[i] = slowOrder[j];
            totalSlowRate[j] = temp1;
            slowOrder[j] = temp2;
          }
        }
      }
      for(var i=0;i<count/4;i++){
        slowPile[slowOrder[i]]--;
        slowPile[slowOrder[count-i]]++;
      }
    }


    function judgeCharging(id,startTime,type){    //记录充电时长
      if(type === 0){
        quickCharge[id][startTime].charging += 1;
      }
      else{
        slowCharge[id][startTime].charging += 1;
      }
    }

    function judgePile(id,startTime,eventDur) {   //快慢充使用区分
      if(eventDur <= 4) {
        quickChargingEvent[id] += 1;

        quickCharge[id][startTime].toCharge += 1;
        if (quickPile[id] > quickCharge[id][startTime].charging) {
          quickCharge[id][startTime].newCharge += 1;
          quickChargingTime[id] += eventDur;
          for (var i = startTime; i < startTime + eventDur; i++) {
            if (i < 24) {
              judgeCharging(id, i, 0);
            }
          }
        }
        else {
          quickMiss[id] += 1;
        }
      }
      else{
        slowChargingEvent[id] += 1;

        slowCharge[id][startTime].toCharge += 1;
        if (slowPile[id] > slowCharge[id][startTime].charging) {
          slowCharge[id][startTime].newCharge += 1;
          slowChargingTime[id] += eventDur;
          for (var i = startTime; i < startTime + eventDur; i++) {
            if (i < 24) {
              judgeCharging(id, i, 1);
            }
          }
        }
        else {
          slowMiss[id] += 1;
        }
      }
    }

    function calcEvent() {    //计算事件满足度
      for(var i=0;i<square.length;i++){
        quickChargingTime[i] = 0;
        slowChargingTime[i] = 0;
        quickMiss[i] = 0;
        slowMiss[i] = 0;
        quickChargingEvent[i] = 0;
        slowChargingEvent[i] = 0;
      }
      totalQuickMissRate = 0;
      totalQuickFillRate = 0;
      totalSlowMissRate = 0;
      totalSlowFillRate = 0;
      quickCount = 0;
      slowCount = 0;
      for(var i=0;i<square.length;i++){
        quickCharge[i] = new Array();
        slowCharge[i] = new Array();
        for(var j=0;j<24;j++) {
          quickCharge[i][j] = new Object();
          quickCharge[i][j].toCharge = 0;
          quickCharge[i][j].charging = 0;
          quickCharge[i][j].newCharge = 0;
          slowCharge[i][j] = new Object();
          slowCharge[i][j].toCharge = 0;
          slowCharge[i][j].charging = 0;
          slowCharge[i][j].newCharge = 0;
        }
      }
      if(usage == 0.02) {
        for (var i = 0; i < event_2.length; i++) {
          var id = event_2[i].gridID;
          var startTime = event_2[i].startTime;
          var eventDur = event_2[i].eventDur;
          if (id >= 0 && id <= 7295 && startTime >= 0 && startTime <= 23) {
            judgePile(id,startTime,eventDur);
          }
        }
      }
      else if(usage == 0.05) {
        for (var i = 0; i < event_5.length; i++) {
          var id = event_5[i].gridID;
          var startTime = event_5[i].startTime;
          var eventDur = event_5[i].eventDur;
          if (id >= 0 && id <= 7295 && startTime >= 0 && startTime <= 23) {
            judgePile(id,startTime,eventDur);
          }
        }
      }
      else if(usage == 0.1) {
        for (var i = 0; i < event_10.length; i++) {
          var id = event_10[i].gridID;
          var startTime = event_10[i].startTime;
          var eventDur = event_10[i].eventDur;
          if (id >= 0 && id <= 7295 && startTime >= 0 && startTime <= 23) {
            judgePile(id,startTime,eventDur);
          }
        }
      }
      for(var i=0;i<square.length;i++) {
        if (quickPile[i] > 0 && quickChargingEvent[i] > 0) {
          var missRate = quickMiss[i] / quickChargingEvent[i];
          var fillRate = quickChargingTime[i] / quickPile[i] / 24;
          totalQuickMissRate += missRate;
          totalQuickFillRate += fillRate;
          quickCount++;
          totalQuickRate[i] = (0.5 * fillRate + 0.5 * (1 - missRate)).toFixed(4);
        }
        else {
          totalQuickRate[i] = 0;
        }
        if (slowPile[i] > 0 && slowChargingEvent[i] > 0) {
          var missRate = slowMiss[i] / slowChargingEvent[i];
          var fillRate = slowChargingTime[i] / slowPile[i] / 24;
          totalSlowMissRate += missRate;
          totalSlowFillRate += fillRate;
          slowCount++;
          totalSlowRate[i] = (0.5 * fillRate + 0.5 * (1 - missRate)).toFixed(4);
        }
        else {
          totalSlowRate[i] = 0;
        }
      }
    }

    function initSet() {
      var rate = ratio;
      for(var i=0;i<square.length;i++){
        pile[i] = Math.round(totalPile*square[i].density);
        totalPile -= pile[i];
        quickPile[i] = Math.round(pile[i]*rate/(1+rate));
        slowPile[i] = pile[i] - quickPile[i];
      }
      while(totalPile > 0){
        var randomId = Math.round(Math.random()*square.length);
        if(pile[randomId] > 0) {
          if (totalPile > 1) {
            pile[randomId] += 2;
            quickPile[randomId] += 1;
            slowPile[randomId] += 1;
            totalPile -= 2;
          }
          else {
            pile[randomId] += 1;
            quickPile[randomId] += 1;
            totalPile -= 1;
          }
        }
      }
    }

    function calcPile() {
      totalPile = sum;
      initSet();
      calcEvent();
      while (1) {
        currentQuickRate = calcQuickRate();
        var currentQuickPile = quickPile;
        adjustQuickPile();
        calcEvent();
        if (currentQuickRate >= calcQuickRate()) {
          quickPile = currentQuickPile;
          break;
        }
      }
      while (1) {
        currentSlowRate = calcSlowRate();
        var currentSlowPile = slowPile;
        adjustSlowPile();
        calcEvent();
        var currentSlowPile = slowPile;
        if (currentSlowRate >= calcSlowRate()) {
          slowPile = currentSlowPile;
          break;
        }
      }
      var rate1, rate2;
      rate1 = ((totalQuickFillRate / quickCount) * 0.5 + (1 - (totalQuickMissRate / quickCount)) * 0.5).toFixed(4);
      rate2 = ((totalSlowFillRate / slowCount) * 0.5 + (1 - (totalSlowMissRate / slowCount)) * 0.5).toFixed(4);
      //console.log("Quick--MissRate:"+(totalQuickMissRate/quickCount).toFixed(4)+",FillRate:"+(totalQuickFillRate/quickCount).toFixed(4));
      //console.log("Slow--MissRate:"+(totalSlowMissRate/slowCount).toFixed(4)+",FillRate:"+(totalSlowFillRate/slowCount).toFixed(4));

      for (var i = 0; i < square.length; i++) {
        var kind = district[i].kind;
        if (quickPile[i] > 0) {
          count1[kind]++;
        }
        if (slowPile[i] > 0) {
          count2[kind]++;
        }
        disQuickPile[kind] += quickPile[i];
        disQuickRate[kind] += Number(totalQuickRate[i]);
        disSlowPile[kind] += slowPile[i];
        disSlowRate[kind] += Number(totalSlowRate[i]);
      }
      for(var i=0;i<10;i++){
        disPile[i] = new Object();
        disPile[i].name = districtName[i];
        if(i == 5) {
          disPile[i].quick = disQuickPile[5]+disQuickPile[6];
          disPile[i].slow = disSlowPile[5]+disSlowPile[6];
          i++;
        }
        else{
          disPile[i].quick = disQuickPile[i];
          disPile[i].slow = disSlowPile[i];
        }
      }
      console.log(disQuickPile);
      console.log(disSlowPile);
    }
  }

  async getPos() {
    const query = this.ctx.query;
    const pos = new Object()
    pos.longtitude = query.longtitude;
    pos.latitude = query.latitude;
    console.log(pos);
    var grid = new Array();   //网格坐标
    var gridClip = new Array();   //有效网格坐标
    var resultGrid = new Array();
    var resultMidId = new Array();
    var result = new Array()

    const gridall = fs.readFileSync(path.join(folder, 'gridall.csv'), 'utf8');
    const gridclip = fs.readFileSync(path.join(folder, 'gridclip.csv'), 'utf8');
    Papa.parse(gridall, {
      complete: (results) => {
        var data = results.data, html;
        console.log(data.length);
        for(var i = 1, _l = data.length-1; i < _l; i++) {
          var item = data[i];
          grid[i-1] = new Object();
          grid[i-1].longitude = item[1];
          grid[i-1].latitude = item[2];
          grid[i-1].x = item[3];
          grid[i-1].y = item[4];
        }
      }
    });
    Papa.parse(gridclip, {
      complete: function(results) {
        var data = results.data, html;
        for(var i = 1, _l = data.length-1; i < _l; i++) {
          var item = data[i];
          gridClip[i-1] = new Object();
          gridClip[i-1].longitude = item[2];
          gridClip[i-1].latitude = item[3];
          gridClip[i-1].x = item[4];
          gridClip[i-1].y = item[5];
        }
      }
    });

    function searchAll(pos) {
      var minDist = maxInt;
      var nearGrid = new Object()
      nearGrid.x = -1;
      nearGrid.y = -1;
      for(var i=0;i<grid.length;i++){
        var deltaX = grid[i].longitude - pos.longtitude;
        var deltaY = grid[i].latitude - pos.latitude;
        var newDist = deltaX*deltaX+deltaY*deltaY;

        if(newDist < minDist){
          minDist = newDist;
          nearGrid.x = grid[i].x;
          nearGrid.y = grid[i].y;
        }
      }
      return nearGrid;
    }

    function searchClip(nearGrid) {
      for(var i=0;i<gridClip.length;i++){
        if(gridClip[i].x == nearGrid.x && gridClip[i].y == nearGrid.y){
          return i;
        }
      }
      return -1;
    }

    const posGrid= searchAll(pos);
    console.log(posGrid);
    if(posGrid.x <0 || posGrid.y < 0){
      for(var i=0;i<25;i++){
        result.push(-1);
      }
    }
    else {
      const move = [-2,-1,0,1,2];
      for(var i=0;i<5;i++) {
        const _grid = new Object();
        _grid.x = Number(posGrid.x);
        _grid.y = Number(posGrid.y) + move[i];
        resultMidId.push(_grid);
      }
      console.log(resultMidId);
      for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {
          const _grid = new Object();
          _grid.x = Number(resultMidId[i].x)+move[j];
          _grid.y = Number(resultMidId[i].y);
          resultGrid.push(_grid);
        }
      }
      console.log(resultGrid);
      resultGrid.sort(function (a, b) {
        if(a.x<b.x) {
          return true
        }
        else if(a.x === b.x){
          return b.y-a.y;
        }
        else{
          return false;
        }
      });
      console.log(resultGrid);
      for(var i=0;i<25;i++){
        var gridPile = new Object();
        var id = searchClip(resultGrid[i]);
        console.log(id);
        if(id<0){
          gridPile.quick = 0;
          gridPile.slow = 0;
        }
        else {
          gridPile.quick = quickPile[id];
          gridPile.slow = slowPile[id];
        }
        result.push(gridPile);
      }
    }
    this.ctx.body = result;
  }
}

module.exports = HomeController;
