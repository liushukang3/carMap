**1.先看效果:**
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/528a91bd065a404c91a15fa21ec2d954~tplv-k3u1fbpfcp-watermark.image?)

    实现功能如下:
    (1) 轨迹播放/暂停、重置。
    (2) 轨迹播放时进度条实时改变。
    (3) 经过点位时显示到访时间。
    

**2.实现过程:**

(1) 使用 vue-baidu-map 的 bml-lushu 路书 搭配 bm-driving 驾车路线规划 及bm-marker覆盖物 组件实现，文档地址 [https://dafrok.github.io/vue-baidu-map/#/zh/bmaplib/lushu](url) 。<br /> 
(2) 安装好vue-baidu-map后把路书文档示例复制到项目，即可得到简单的路书。<br />
(3) 看bm-driving的文档，是可以设置起点终点，以及途经点的，所以一开始是打算用`waypoints`设置途径点，但是`waypoints最多只能设置10个点位`，而且起点和终点可能是一致的（绕了一圈的情况），所以就放弃了。<br />
(4) 思考后，感觉可以`把途经点拆分成多段`，如经过ABCD点，则bm-driving 可以分为 A-B，B-C, C-D 三段，bm-driving用v-for渲染，然后在`@searchcomplete`事件中，把对应路段的坐标保存起来，合并在一起，就成了路书最终的所有点了。<br />
(5) 然后在bm-driving中利用 `@markersset方法`调用`this.map.removeOverlay` 方法即可删除原来的起点终点图标，然后`使用 bm-marker添加自定义的图标`。<br />
(6) 之后，控制 `bml-lushu`的play状态，即可实现播放暂停。<br />
(7) 重置则需要调用 `lushu.stop();lushu._marker.setPosition(point);`先让路书停止，再重新设置小车坐标即可。(`lushu为 路书的实例`，全局搜BMapLib.LuShu可查找到Lushu.vue的位置，通过`查看Lushu.vue的源码`可得知bml-lushu使用`this.originInstance 存储路书实例`，因此，可以给bml-lushu添加ref，通过this.refs即可调用子组件的data/methods，即this.$refs.xxx.originInstance即为路书实例)<br />
(8) 经过上述处理后即可得到可播放暂停、重置的轨迹了。<br />

(9) 实现进度条，则需要修改原型，全局搜索`_moveNext`找到`bmaplib.lushu/index.js` 路书源码，查看_move和_moveNext方法可大概得知小车是利用定时器不断修改位置，进行移动的。而`_moveNext`接受的参数又是`index`,所以用 `index / 路书长度`，就可以粗略得到移动进度的百分比了。(直接修改源码无效，应该是被打包压缩到vue-baidu-map了，因此需要`通过原型重写_moveNext`: let proto = Object.getPrototypeOf(lushu); proto._moveNext = function(index){...})<br />

(10) 实现经过点位时显示到访时间的功能，同样需要修改`_moveNext`: 上述第(2)步中处理每段坐标时，增加参数存储每段坐标的长度，并计算出每段位置最大的坐标。小车经过时，如果该段位置的最大坐标大于当前坐标，即表示小车在当前路段，即可用当前路段下标获取对应的数据，进而显示该路段起点信息。



    注意: vue-baidu-map使用的是JavaScript API v2.0的接口,
    文档地址: https://lbsyun.baidu.com/cms/jsapi/reference/jsapi_reference.html
