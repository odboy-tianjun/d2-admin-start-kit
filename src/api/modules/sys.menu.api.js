export default ({ service, request, serviceForMock, requestForMock, mock, faker, tools }) => ({
  /**
   * @description 获取菜单与路由
   */
  SYS_MENU () {
    // 模拟数据
    mock
      .onAny('/menu')
      .reply(() => {
        const aside = [
          {
            title: '百度一下',
            icon: 'folder-o',
            path: 'https://www.baidu.com'
          },
          {
            title: '单页面',
            icon: 'folder-o',
            path: '/page1'
          },
          {
            title: '二级目录',
            icon: 'folder-o',
            children: [
              { path: '/page2', title: '页面 2' },
              { path: '/page3', title: '页面 3' },
              { path: '/page4', title: '页面 4' }
            ]
          }
        ]
        const header = aside
        const routes = [
          { path: '/page1', name: 'page1', meta: { title: '单页面', auth: true }, component: 'demo/page1' },
          { path: '/page2', name: 'page2', meta: { title: '页面 2', auth: true }, component: 'demo/page2' },
          { path: '/page3', name: 'page3', meta: { title: '页面 3', auth: true }, component: 'demo/page3' },
          { path: '/page4', name: 'page4', meta: { title: '页面 4', auth: true }, component: 'demo/page4' }
        ]
        return tools.responseSuccess({ header, aside, routes })
      })
    // 接口请求
    return requestForMock({
      url: '/menu',
      method: 'get'
    })
  }
})
