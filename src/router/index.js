import { createRouter, createWebHistory } from 'vue-router'
import Auth from '../views/Auth.vue'
import HomeView from '../views/HomeView.vue'
import Profile from '../views/Profile.vue'
import Track from '../views/Track.vue'
import LibraryView from '../views/SearchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomeView
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
    }
  ]
})

export default router
