<template>
  <div class="map">
    <!-- 地图 -->
    <baidu-map
      class="themap"
      :center="center"
      :zoom="zoom"
      :maxZoom="29"
      :scroll-wheel-zoom="true"
      @ready="mapReady"
      @zoomstart="zoomstart"
      @zoomend="zoomend"
      :key="mapKey"
    >
      <div class="playControl">
        <div class="playbox">
          <span
            class="playicon"
            :class="[play ? 'pause' : 'start']"
            @click="playClick"
          >{{play ? '暂停' : '开始'}}</span>
          <span class="progressbox">
            <span class="progress" :style="{ width: progressWidth|| 0 }"></span>
          </span>
          <span class="thedate">{{throughDate}}</span>
          <span class="resetbox" @click="resetClick">
            <span class="reseticon"></span>
            <span class="resettext">回到起始</span>
          </span>
        </div>
      </div>
      <bm-driving
        :start="item[0]"
        :end="item[1]"
        :panel="false"
        :autoViewport="true"
        v-for="(item, index) in drivingList"
        :key="index"
        @searchcomplete="handleSearchComplete($event, index)"
        @markersset="handelMarkersset"
      ></bm-driving>
      <bm-marker
        class="map-bm-marker"
        v-for="(item, index) in pointList"
        :key="item.scode+index"
        :position="item"
        :icon="pointIcon"
      >
        <bm-label
          :content="''+(index+1)"
          :position="item"
          :zIndex="1"
          :offset="{ width: nameWidth(index+1), height: 6 }"
          class="map-bm-label"
          :labelStyle="labelStyle"
        />
        <bm-label
          :content="item.sname"
          :position="item"
          :zIndex="1"
          :offset="{ width: nameWidth(item.sname,true), height: 28 }"
          class="map-bm-label"
          :labelStyle="labelStyle_name"
        />
      </bm-marker>

      <bml-lushu
        :path="path"
        :icon="carIcon"
        :play="play"
        :speed="speed"
        :rotation="true"
        :autoView="true"
        ref="bmlLushu"
        v-if="readyKey == 0"
        @stop="stop"
        @ready="lushuReady"
      ></bml-lushu>
    </baidu-map>

    <div class="thetable">
        <div class="row">
          <span class="column">序号</span>
          <span class="column">场所</span>
          <span class="column">到访时间</span>
        </div>
        <div class="row" v-for="(item,index) in mapData" :key="index">
          <span class="column">{{index+1}}</span>
          <span class="column">{{item.SiteName}}</span>
          <span class="column">{{item.ThroughTime}}</span>
        </div>
    </div>
  </div>
</template>
<script>
import { BmlLushu } from "vue-baidu-map";

const CAR_POINT = "data:image/png;base64,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";
export default {
  components: {
    BmlLushu
  },
  props: {
    mapData: {
      type: Array,
      default: () => {
        return [
          {
            VLPN: "测A12345",
            VLPNColor: "02",
            ThroughtStatus: 1,
            ThroughTime: "2023-01-13 17:34:10",
            ThroughStatus: null,
            ID: 16,
            SiteCode: "A001",
            SiteName: "三水***公司",
            SiteType: "03",
            Status: 1,
            Lng: "117.945653",
            Lat: "30.981956",
            Address: "地址1",
            Manager: "张**",
            Phone: "132*",
            CreateTime: "2023-05-12 15:51:01",
            UpdateTime: "2023-05-15 17:08:20"
          },
          {
            VLPN: "测A12345",
            VLPNColor: "02",
            ThroughtStatus: 1,
            ThroughTime: "2023-02-13 11:32:10",
            ThroughStatus: null,
            ID: 18,
            SiteCode: "A002",
            SiteName: "津州***有限公司",
            SiteType: "01",
            Status: 1,
            Lng: "125.335452",
            Lat: "43.969839",
            Address: "宽城区**",
            Manager: "王**",
            Phone: "150*",
            CreateTime: "2023-05-15 17:13:36",
            UpdateTime: "2023-05-15 17:19:18"
          },
          {
            VLPN: "测A12345",
            VLPNColor: "02",
            ThroughtStatus: 1,
            ThroughTime: "2023-04-13 18:32:12",
            ThroughStatus: null,
            ID: 21,
            SiteCode: "A003",
            SiteName: "佛山*****公司",
            SiteType: "03",
            Status: 1,
            Lng: "127.608870",
            Lat: "41.692650",
            Address: "广东省**********4号",
            Manager: "李*",
            Phone: "132*",
            CreateTime: "2023-05-15 17:18:58",
            UpdateTime: "2023-05-15 17:19:20"
          },
          {
            VLPN: "测A12345",
            VLPNColor: "02",
            ThroughtStatus: 1,
            ThroughTime: "2023-04-18 09:32:12",
            ThroughStatus: null,
            ID: 21,
            SiteCode: "A003",
            SiteName: "佛山*****公司",
            SiteType: "03",
            Status: 1,
            Lng: "127.608870",
            Lat: "41.692650",
            Address: "广东省**********4号",
            Manager: "李**",
            Phone: "132*",
            CreateTime: "2023-05-15 17:18:58",
            UpdateTime: "2023-05-15 17:19:20"
          }
        ];
      }
    }
  },
  data() {
    return {
      mapKey: 1,
      map: null,
      BMap: null,
      lushu: null,
      center: {}, // 地图中心点
      zoom: 11,   // 默认缩放大小
      timer: null,
      timer_lushu: null,
      center_lng: 0, // 记录的中点
      center_lat: 0,
      play: false,
      path: [],
      pathLength: [],    // 每个起点终点的长度，用来切换点位时间
      speed: 4000,
      readyKey: -1,      // 渲染标识
      drivingList: [],   // 生成路线的起点终点集合
      pointList: [],     // 点位
      progressWidth: 0,  // 进度条宽度
      throughDate: "",   // 经过该点位时间
      carIcon: {
        url: "http://api.map.baidu.com/library/LuShu/1.2/examples/car.png",
       size: {width: 52, height: 26},
        opts: {anchor: {width: 27, height:13}}
      },
      pointIcon: { url: CAR_POINT, size: { width: 33, height: 36 } },
      labelStyle: {
        border: "none",
        background: "transparent",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 600
      },
      labelStyle_name: {
        border: "none",
        color: "#1890ff",
        fontSize: "12px",
        background: "rgba(255, 255, 255, 0.68)",
        backdropFilter: "blur(1px)",
        borderRadius: "4px",
        padding: "5px 10px"
      }
    };
  },
  computed: {
    // 动态计算偏移位置使label偏移至中间
    nameWidth(value) {
      return function(value, isStation = false) {
        value = "" + value;
        let fontSize = "12px";
        let newFontSize = fontSize ? parseInt(fontSize) : 0;

        if (isStation) {
          let reg = /^[A-Za-z0-9]*$/;
          if (reg.test(value)) {
            // 如果是字母数字，需要减少一半
            return -(((value.length - 1) / 2 / 2) * newFontSize);
          } else {
            return -(((value.length - 1) / 2) * newFontSize);
          }
        }

        if (value.length == 1) {
          return newFontSize;
        } else if (value.length == 2) {
          return newFontSize / 1.5;
        } else if (value.length == 3) {
          return newFontSize / 2.5;
        } else if (value.length == 4) {
          return newFontSize / 4;
        }

        return 0;
      };
    }
  },
  methods: {
    // 地图加载完成以后  获取地图实例， 设置地图样式
    mapReady({ BMap, map }) {
      this.map = map;
      this.BMap = BMap;
    },

    // 放大开始时记录中点（如果鼠标滚轮放大缩小时不发生偏移，则不需要zoomstart和zoomend）
    zoomstart(e) {
      if (!this.map) {
        return;
      }
      this.center_lng = this.map.getCenter().lng;
      this.center_lat = this.map.getCenter().lat;
    },
    // 移动到中点（不移会偏移）
    zoomend() {
      if (!this.map) {
        return;
      }
      // 使用map.centerAndZoom 还是会有轻微偏移，所以直接使用panTo
      this.map.panTo(new BMap.Point(this.center_lng, this.center_lat));
    },

    lushuReady(res) {
      this.timer_lushu = setTimeout(() => {
        // 全局搜BMapLib.LuShu可查找到Lushu.vue和 bmaplib.lulhu/index.js源码位置
        // 通过源码可得知路书bml-lushu使用 this.originInstance 存储路书实例，故使用refs调用
        let lushu =
          this.$refs.bmlLushu && this.$refs.bmlLushu.originInstance
            ? this.$refs.bmlLushu.originInstance
            : "";

        this.lushu = lushu; // 存储路书实例

        let proto = Object.getPrototypeOf(lushu); // 原型

        let _this = this;

        // 处理进度条宽度
        function handlePercent(index, length) {
          let percent = Math.floor((index / length) * 100000) / 1000;
          _this.progressWidth = percent + "%";
        }
        // 点位时间
        function handleStationPoint(index) {
          // 如果路段的下标大于小车当前的index则表示小车在该路段
          let pointIndex = _this.pathLength.findIndex(v => v > index);
          let lastFlag = pointIndex == -1;
          pointIndex = lastFlag ? _this.drivingList.length - 1 : pointIndex;

          let pointArr = _this.drivingList[pointIndex] || [];
          let pointObj = lastFlag ? pointArr[1] : pointArr[0] || {};
          pointObj && Object.keys(pointObj).length
            ? _this.throughDate = pointObj.sdate
            : "";
        }

        // 改原型实现进度条和经过点位时返回信息 (改源码无效，因为已经被打包压缩到vue-baidu-map了)
        proto._moveNext = function(index) {
          var me = this; // 此处的this指lushu实例
          if (index < this._path.length - 1) {
            handlePercent.call(_this, index, this._path.length); // 进度条
            handleStationPoint.call(_this, index); // 点位

            me._move(me._path[index], me._path[index + 1], me._tween.linear);
          } else {
            handlePercent.call(_this, 1, 1); // 进度条设置为100%
            me.stop();
          }
        };
      }, 100);
    },
    stop() {
      this.play = false;
    },

    // 播放/暂停
    playClick() {
      if (!this.map) {
        return;
      }
      if (!this.path.length) {
        alert("暂无轨迹")
        return;
      }
      this.play = !this.play;
    },

    // 重置
    resetClick() {
      if (!this.BMap && !this.path && !this.path.length) {
        return;
      }
      this.map.panTo(new BMap.Point(this.center.lng, this.center.lat));
      this.play = false;

      let lushu = this.lushu || "";
      if (lushu && lushu._marker && this.path) {
        lushu.stop();
        lushu._marker.setPosition(this.path[0]); // 回到原点
        this.progressWidth = 0;
        this.throughDate = "";
      }
    },

    // 删除起点终点图标
    handelMarkersset(pois, transfers) {
      this.map.removeOverlay(pois[0].marker); 
      this.map.removeOverlay(pois[pois.length - 1].marker);
    },

    // 按顺序存储线路点位
    handleSearchComplete(res, k) {
      if (this.readyKey == this.drivingList.length) {
        this.path = [];
      }
      this.readyKey--; // 渲染标识，
      this.path[k] = res
        .getPlan(0)
        .getRoute(0)
        .getPath();

      this.pathLength[k] = this.path[k].length - 1; // 记录每批数据的最大index

      if (this.readyKey != 0) {
        return;
      } // 最后一条路线渲染完成才下一步处理
      let tempPath = this.path;
      let tempPathLength = [];
      let newPath = [];
      tempPath.forEach(e => {
        if (e) {
          newPath = newPath.concat(e);
        }
      });
      this.$set(this, "path", newPath);

      let lenNum = 0;
      this.pathLength.forEach(e => {
        lenNum += e;
        tempPathLength.push(lenNum);
      });
      // console.log("tempPathLength>>>>>>>>>>>>",tempPathLength)
      this.$set(this, "pathLength", tempPathLength);

      if (this.path && this.path.length) {
        this.setSpeed(this.path.length); // 设置速度

        this.handleCenter({
          // 起点设置为中点
          lng: this.path[0].lng,
          lat: this.path[0].lat
        });
      }
    },

    // 设置中心点
    handleCenter({ lng, lat }) {
      this.center.lng = lng;
      this.center.lat = lat;
      this.center_lng = this.center.lng;
      this.center_lat = this.center.lat;
    },

    // 动态计算速度
    // plength  路书点位长度
    setSpeed(plength) {
      let defaultSpeed = 4000;
      let multiple = 1;
      if (plength >= 20000) {
        multiple = 20;
      } else if (plength >= 8000) {
        multiple = 15;
      } else if (plength >= 4000) {
        multiple = 10;
      } else if (plength >= 800) {
        multiple = 2;
      }
      this.speed = defaultSpeed * multiple;
    },
    // 清除所有
    clearAll() {
      this.progressWidth = 0;
      this.drivingList = [];
      this.pointList = [];
      this.play = false;
      this.throughDate = "";
    },

    // 处理点位
    handlePath() {
      let pointList = [];
      let pointList_norepeat = []; // 去重后的数据
      let drivingList = [];
      this.mapData.forEach((v, i) => {
        let obj = {
          lng: v.Lng,
          lat: v.Lat,
          sname: v.SiteName,
          scode: v.SiteCode,
          sdate: v.ThroughTime,
          sindex: i + 1
        };
        pointList.push(obj);

        let index = pointList_norepeat.findIndex(
          e => e.sname == obj.sname && e.scode == obj.scode
        );
        index == -1 ? pointList_norepeat.push(obj) : "";
      });

      drivingList = this.handleDrivingData(pointList);

      // console.log("drivingList>>>>>>>>>>>.",drivingList)

      this.readyKey = drivingList.length; // 路线数据，不用去重，否则线路不完整
      this.drivingList = drivingList;
      this.pointList = pointList_norepeat; //点位数据，去重
      this.play = this.readyKey == 1;
    },

    // 递归处理起点终点
    handleDrivingData(data, arr = []) {
      let newArr = arr || [];
      let copyData = JSON.parse(JSON.stringify(data));
      newArr.push(copyData.slice(0, 2));
      copyData.splice(0, 1);
      if (copyData.length && copyData.length >= 2) {
        this.handleDrivingData(copyData, newArr);
      }
      if (newArr.length == 1 && newArr[0][0] && !newArr[0][1]) {
        // 只有一个点时特别处理
        newArr[0][1] = newArr[0][0];
      }
      return newArr;
    }
  },
  created() {},
  mounted() {},
  beforeDestroy() {
    clearTimeout(this.timer);
    clearTimeout(this.timer_lushu);
  },
  watch: {
    mapData: {
      handler(newval, oldval) {
        if (!newval) return;
        if (!newval.length) {
          this.clearAll();
          return;
        }
        if (
          oldval &&
          oldval &&
          JSON.stringify(newval) == JSON.stringify(oldval)
        ) {
          return;
        }
        this.mapKey++;
        this.progressWidth = 0;
        this.handlePath();
      },
      immediate: true,
      deep: true
    }
  }
};
</script>
<style lang="scss" scoped>
.map {
  width: 50%;
  height: 550px;
  margin: 100px auto 0 auto;
}
.themap {
  width: 100%;
  height: 100%;
  position: relative;
  ::v-deep .anchorBL {
    display: none;
  }

  .playControl {
    width: calc(100% - 40px);
    position: absolute;
    display: flex;
    align-items: center;
    height: 30px;
    background: rgba(255, 255, 255, 0.68);
    backdrop-filter: blur(1px);
    border-radius: 4px;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    padding: 0 20px;
    box-sizing: border-box;
    .playbox {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      position: relative;
    }
    .playicon {
      display: inline-block;
      min-width: 18px;
      min-height: 18px;
      border-radius: 50%;
      background-size: contain;
      background-repeat: no-repeat;
      color: #1890ff;
      cursor: pointer;
    }
    .progressbox {
      width: 70%;
      height: 6px;
      background: rgba(24, 144, 255, 0.39);
      border-radius: 3px;
      position: relative;
      margin-left: 15px;
      .progress {
        width: 0;
        height: 6px;
        background: rgba(24, 144, 255, 1);
        opacity: 1;
        border-radius: 3px;
        position: absolute;
        left: 0;
      }
    }
    .thedate {
      font-size: 12px;
      margin-left: 8px;
      cursor: default;
    }
    .resetbox {
      margin-left: auto;
      white-space: nowrap;
      display: flex;
      align-items: center;
      cursor: pointer;
      .reseticon {
        display: inline-block;
        width: 12px;
        height: 11px;
        border: 1px solid #1890ff;
        position: relative;
        border-radius: 50%;
        margin: 0 5px;
        &:after {
          position: absolute;
          content: "";
          width: 1px;
          height: 4px;
          background: #1890ff;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
      }
      .resettext {
        font-size: 12px;
        color: #1890ff;
      }
    }
  }
}

.thetable {
  width: 100%;
  height: 200px;
  overflow: auto;
  margin-top: 40px;
  .row{
    display: flex;
    .column {
      flex: 1;
      border: 1px solid #dddddd;
    }
  }
}
</style>
