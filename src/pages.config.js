/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminBlog from './pages/AdminBlog';
import AdminVerification from './pages/AdminVerification';
import Applications from './pages/Applications';
import Asap from './pages/Asap';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Chat from './pages/Chat';
import ComingSoon from './pages/ComingSoon';
import CreateTask from './pages/CreateTask';
import CreateTestTasks from './pages/CreateTestTasks';
import CustomerTasks from './pages/CustomerTasks';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Live from './pages/Live';
import Map from './pages/Map';
import MyTasks from './pages/MyTasks';
import Onboarding from './pages/Onboarding';
import OrganizationTasks from './pages/OrganizationTasks';
import Profile from './pages/Profile';
import TaskDetail from './pages/TaskDetail';
import Verification from './pages/Verification';
import adminblog from './pages/adminblog';
import adminverification from './pages/adminverification';
import blog from './pages/blog';
import blogpost from './pages/blogpost';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminBlog": AdminBlog,
    "AdminVerification": AdminVerification,
    "Applications": Applications,
    "Asap": Asap,
    "Blog": Blog,
    "BlogPost": BlogPost,
    "Chat": Chat,
    "ComingSoon": ComingSoon,
    "CreateTask": CreateTask,
    "CreateTestTasks": CreateTestTasks,
    "CustomerTasks": CustomerTasks,
    "Home": Home,
    "Landing": Landing,
    "Live": Live,
    "Map": Map,
    "MyTasks": MyTasks,
    "Onboarding": Onboarding,
    "OrganizationTasks": OrganizationTasks,
    "Profile": Profile,
    "TaskDetail": TaskDetail,
    "Verification": Verification,
    "adminblog": adminblog,
    "adminverification": adminverification,
    "blog": blog,
    "blogpost": blogpost,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};