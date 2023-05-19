import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import BaiduMap from 'vue-baidu-map'

Vue.config.productionTip = false;
Vue.use(BaiduMap, {ak: 'youkey'})
new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
