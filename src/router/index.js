import { createRouter, createWebHistory } from 'vue-router'
import Auth from '../views/Auth.vue'
import HomeView from '../views/HomeView.vue'
import Profile from '../views/Profile.vue'
import Track from '../views/Track.vue'
import ShopView from '../views/ShopView.vue'
import LibraryView from '../views/LibraryView.vue'
import PlaylistView from '../views/PlaylistView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomeView
    },
    {
      path: '/Shop',
      component: ShopView
    },
    {
      path: '/user/:userID',  // Dynamic route to match userID
      name: 'UserProfile',
      component: Profile,
    },
    {
      path: '/track/:trackID',  // Dynamic route to match userID
      name: 'TrackProfile',
      component: Track,
    },
    {
      path: '/library',
      component: LibraryView
    },
    {
      path: '/library/:genre',
      name: 'Playlist',
      component: PlaylistView,
      props: true, // this passes route params as props to PlaylistView
    },
  ]
})

export default router
