import { createRouter, createWebHistory } from 'vue-router'
import Auth from '../views/Auth.vue'
import HomeView from '../views/HomeView.vue'
import Profile from '../views/Profile.vue'
import Track from '../views/Track.vue'
import ShopView from '../views/ShopView.vue'
import LibraryView from '../views/LibraryView.vue'
import PlaylistView from '../views/PlaylistView.vue'
import EmbedMusicPlayer from '../components/EmbedMusicPlayer.vue';

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
      path: '/track/:customID?/:trackID',  // Dynamic route to match userID
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
    {
      path: '/library/MyLikes',
      name: 'Liked',
      component: PlaylistView,
      props: true, // this passes route params as props to PlaylistView
    },
    {
      path: '/embed/:trackId',
      name: 'embed',
      component: EmbedMusicPlayer,
      props: true, // Allow trackId to be passed as a prop
    },
  ]
})

export default router
