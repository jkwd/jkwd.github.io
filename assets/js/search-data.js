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
        },{id: "post-chess-de-project",
        
          title: "Chess DE Project",
        
        description: "Chess Dashboard Data Engineering Project using Dagster, DuckDB, dlt, dbt",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/chess-de-project/";
          
        },
      },{id: "post-full-vs-incremental-load",
        
          title: "Full vs incremental load",
        
        description: "Explaining pros and cons of Full Load vs Incremental Load",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/full-vs-incremental-load/";
          
        },
      },{id: "post-benchmarking-oltp-vs-olap",
        
          title: "Benchmarking OLTP vs OLAP",
        
        description: "Simple experiment on OLTP and OLAP databases using TPC-H dataset",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/oltp-vs-olap/";
          
        },
      },{id: "post-github-actions-tutorial",
        
          title: "Github Actions Tutorial",
        
        description: "Notes on Github Actions",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/github-actions/";
          
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
      },{id: "post-databricks-de-associate-notes",
        
          title: "Databricks DE Associate Notes",
        
        description: "Notes for Databricks DE Associate Certification",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/databricks-data-engineer-associate/";
          
        },
      },{id: "post-profiling-my-favourite-songs-on-spotify-through-clustering",
        
          title: "Profiling my favourite songs on Spotify through clustering",
        
        description: "Personal data science EDA project",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2019/profiling-my-favourite-songs-on-spotify-through-clustering/";
          
        },
      },{id: "news-a-simple-inline-announcement",
          title: 'A simple inline announcement.',
          description: "",
          section: "News",},{id: "news-a-long-announcement-with-details",
          title: 'A long announcement with details',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_2/";
            },},{id: "news-a-simple-inline-announcement-with-markdown-emoji-sparkles-smile",
          title: 'A simple inline announcement with Markdown emoji! :sparkles: :smile:',
          description: "",
          section: "News",},{
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
