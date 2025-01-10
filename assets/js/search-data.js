// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-",
    title: "",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/index.html";
          },
        },{id: "nav-about",
          title: "About",
          description: "Hi I&#39;m John! I am currently a Data Engineer and I have been in the data space for 7+ years. I&#39;ve designed and built scalable data pipelines across multiple industries (e.g. logistics, ride hailing, geospatial and cyber security).",
          section: "Navigation",
          handler: () => {
            window.location.href = "/about/";
          },
        },{id: "post-terraform-tutorial",
      
        title: "Terraform Tutorial",
      
      description: "Notes on Terraform",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/blog/2025/terraform-notes/";
        
      },
    },{id: "post-docker-tutorial",
      
        title: "Docker Tutorial",
      
      description: "Notes on Docker",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/blog/2025/docker-notes/";
        
      },
    },{id: "post-airflow-tutorial",
      
        title: "Airflow Tutorial",
      
      description: "Notes on Airflow",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/blog/2025/airflow-notes/";
        
      },
    },{id: "post-profiling-my-favorite-songs-on-spotify-through-clustering",
      
        title: 'Profiling my Favorite Songs on Spotify through clustering <svg width="1.2rem" height="1.2rem" top=".5rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
      
      description: "",
      section: "Posts",
      handler: () => {
        
          window.open("https://towardsdatascience.com/profiling-my-favorite-songs-on-spotify-through-clustering-33fee591783d?source=rss-4b20231e95c9------2", "_blank");
        
      },
    },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%6A%6F%68%6E.%6B%6F%68%77%64@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/jkwd", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/johnkohwd", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/feed.xml", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
