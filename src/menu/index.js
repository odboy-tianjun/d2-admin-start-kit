import { uniqueId } from 'lodash'

function supplementPath (menu) {
  return menu.map(e => ({
    ...e,
    path: e.path || uniqueId('d2-menu-empty-'),
    ...e.children ? {
      children: supplementPath(e.children)
    } : {}
  }))
}

// 启动时不再使用本地菜单，改为登录后从服务端获取
export const menuHeader = supplementPath([])
export const menuAside = supplementPath([])
