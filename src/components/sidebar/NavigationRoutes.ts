export interface INavigationRoute {
  name: string
  displayName: string
  meta: { icon: string }
  children?: INavigationRoute[]
}

export default {
  root: {
    name: '/',
    displayName: 'navigationRoutes.home',
  },
  routes: [
    {
      name: 'dashboard',
      displayName: 'menu.dashboard',
      meta: {
        icon: 'vuestic-iconset-dashboard',
      },
    },
       
       
       {
         name: 'dashboard-bitcoin',
         displayName: 'Dashboard - Bitcoin Account',
         meta: {
        icon: 'vuestic-iconset-dashboard',
         },
       },
       {
         name: 'dashboard-grupo-dms',
         displayName: 'Dashboard - Grupo DMS',
         meta: {
        icon: 'vuestic-iconset-dashboard',
         },
       },
    {
         name: 'control-de-pagos',
         displayName: 'Control de Pagos',
         meta: {
           icon: 'folder_shared',
         },
       },
       
       
    //     children: [
    //       {
    //         name: 'payment-methods',
    //         displayName: 'menu.payment-methods',
    //       },
    //       {
    //         name: 'pricing-plans',
    //         displayName: 'menu.pricing-plans',
    //       },
    //       {
    //         name: 'billing',
    //         displayName: 'menu.billing',
    //       },
    //     ],
    //   },
    //   {
    //     name: 'auth',
    //     displayName: 'menu.auth',
    //     meta: {
    //       icon: 'login',
    //     },
    //     children: [
    //       {
    //         name: 'login',
    //         displayName: 'menu.login',
    //       },
    //       {
    //         name: 'signup',
    //         displayName: 'menu.signup',
    //       },
    //       {
    //         name: 'recover-password',
    //         displayName: 'menu.recover-password',
    //       },
    //     ],
    //   },
    //
    //   {
    //     name: 'faq',
    //     displayName: 'menu.faq',
    //     meta: {
    //       icon: 'quiz',
    //     },
    //   },
    //   {
    //     name: '404',
    //     displayName: 'menu.404',
    //     meta: {
    //       icon: 'vuestic-iconset-files',
    //     },
    //   },
    //   {
    //     name: 'preferences',
    //     displayName: 'menu.preferences',
    //     meta: {
    //       icon: 'manage_accounts',
    //     },
    //   },
    //   {
    //     name: 'settings',
    //     displayName: 'menu.settings',
    //     meta: {
    //       icon: 'settings',
    //     },
    //   },
  ] as INavigationRoute[],
}
