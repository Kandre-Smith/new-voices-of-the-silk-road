/**
 * 大雁塔（大慈恩寺）门票信息 —— 静态展示数据与官方购票渠道配置。
 * 本模块仅信息展示，不承接购票业务；所有购票操作跳转官方渠道。
 * 上线前需替换为官方真实渠道：
 *   - PAGODA_WEB_URL：官方网页购票地址（普通浏览器跳转）
 *   - PAGODA_MINI_USERNAME：微信小程序原始ID（gh_xxx，微信环境唤起小程序）
 *   - PAGODA_MINI_PATH：小程序页面路径
 */
export const PAGODA_WEB_URL = ''; // TODO: 官方网页购票地址
export const PAGODA_MINI_USERNAME = ''; // TODO: 微信小程序原始ID（gh_xxxx，用于 wx-open-launch-weapp）
export const PAGODA_MINI_PATH = ''; // TODO: 小程序页面路径（如 pages/index/index）
export const PAGODA_MINI_LINK = '#小程序://大慈恩寺/5ifIaPsykIK2sqp'; // 小程序口令（用户提供，用于复制到微信打开）
