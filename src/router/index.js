import Vue from 'vue'
import VueRouter from 'vue-router'

// 进度条
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

import store from '@/store/index'
import util from '@/libs/util.js'

// 路由数据
import routes from './routes'
import api from '@/api'

// fix vue-router NavigationDuplicated
const VueRouterPush = VueRouter.prototype.push
VueRouter.prototype.push = function push (location) {
  return VueRouterPush.call(this, location).catch(err => err)
}
const VueRouterReplace = VueRouter.prototype.replace
VueRouter.prototype.replace = function replace (location) {
  return VueRouterReplace.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

let dynamicAdded = false

// 导出路由 在 main.js 里使用
const router = new VueRouter({
  routes
})

/**
 * 路由拦截
 * 权限验证
 */
router.beforeEach(async (to, from, next) => {
  // 确认已经加载多标签页数据 https://github.com/d2-projects/d2-admin/issues/201
  await store.dispatch('d2admin/page/isLoaded')
  // 确认已经加载组件尺寸设置 https://github.com/d2-projects/d2-admin/issues/198
  await store.dispatch('d2admin/size/isLoaded')
  // 进度条
  NProgress.start()
  // 关闭搜索面板
  store.commit('d2admin/search/set', false)
  // 如果已登录且尚未注入动态菜单与路由，先从服务端获取并注入，避免刷新后菜单丢失
  const token = util.cookies.get('token')
  if (token && token !== 'undefined' && !dynamicAdded) {
    try {
      // 重要：避免当前是 /login 时注入导致无限跳转
      if (to.name === 'login') {
        next()
        return
      }
      const menuRes = await api.SYS_MENU()
      const { header = [], aside = [], routes = [] } = menuRes
      store.commit('d2admin/menu/headerSet', header)
      store.commit('d2admin/menu/asideSet', aside)
      store.commit('d2admin/search/init', header)
      const _import = require('@/libs/util.import.' + process.env.NODE_ENV)
      const layoutHeaderAside = require('@/layout/header-aside').default
      const dynamicChildren = routes.map(r => ({
        path: r.path,
        name: r.name,
        meta: r.meta || {},
        component: _import(r.component)
      }))
      if (dynamicChildren.length) {
        router.addRoutes([{ path: '/', component: layoutHeaderAside, children: dynamicChildren }])
        const { frameInRoutes } = require('@/router/routes')
        const dynamicFrameIn = JSON.parse(JSON.stringify(frameInRoutes))
        if (dynamicFrameIn && dynamicFrameIn[0] && Array.isArray(dynamicFrameIn[0].children)) {
          dynamicFrameIn[0].children = dynamicFrameIn[0].children.concat(dynamicChildren)
        }
        store.commit('d2admin/page/init', dynamicFrameIn)
        dynamicAdded = true
        // 关键：重新进入当前路由，确保新注册的路由生效，避免刷新后 404
        next({ path: to.fullPath, replace: true })
        return
      }
      dynamicAdded = true
    } catch (e) {
      // 注入失败直接继续，避免阻塞
    }
  }
  // 验证当前路由所有的匹配中是否需要有登录验证的
  if (to.matched.some(r => r.meta.auth)) {
    if (token && token !== 'undefined') {
      next()
    } else {
      next({
        name: 'login',
        query: {
          redirect: to.fullPath
        }
      })
      NProgress.done()
    }
  } else {
    next()
  }
})

router.afterEach(to => {
  // 进度条
  NProgress.done()
  // 多页控制 打开新的页面
  store.dispatch('d2admin/page/open', to)
  // 更改标题
  util.title(to.meta.title)
})

export default router
