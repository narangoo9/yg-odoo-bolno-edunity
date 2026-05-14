import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const instructors = {
  traversy: {
    name: "Traversy Media",
    email: "traversy-media@youtube.local",
    avatarUrl:
      "https://yt3.ggpht.com/ytc/AIdro_mLysKc36lc_FVk2j777olWvLOjgDz6NCNGdiQBnAKRENM=s68-c-k-c0x00ffffff-no-rj",
    bio: "Official YouTube channel: Traversy Media",
  },
  mosh: {
    name: "Programming with Mosh",
    email: "programming-with-mosh@youtube.local",
    avatarUrl:
      "https://yt3.ggpht.com/HCv0fXFEEcD0HRyF0_qR1K7b7qO3KCzmIoyH1DEJYB94CIUFhIE5i2t2IDIPX97W1-DK4hegww=s68-c-k-c0x00ffffff-no-rj",
    bio: "Official YouTube channel: Programming with Mosh",
  },
};

const courses = [
  {
    slug: "youtube-nodejs-crash-course-traversy",
    title: "Node.js Crash Course",
    shortDescription: "Official Traversy Media Node.js Crash Course split by YouTube timestamps.",
    sourceYoutubeId: "32M1al-Y6Ag",
    sourceYoutubeUrl: "https://www.youtube.com/watch?v=32M1al-Y6Ag",
    durationSeconds: 7595,
    instructorKey: "traversy",
    level: "BEGINNER",
    tags: ["youtube", "nodejs", "javascript", "backend"],
    learningOutcomes: ["Learn Node.js fundamentals from the official Traversy Media video"],
    timestamps: `
0:00 - Intro & Slides
12:18 - Installation
13:22 - Node REPL
15:05 - Setup & package.json Init
16:51 - Running JavaScript Files
19:36 - CommonJS Modules
23:13 - ES Modules
27:20 - HTTP Module & Create Server
35:06 - NPM Scripts
36:15 - NPM Modules & Nodemon
38:45 - .gitignore File
41:06 - Environment Variables & .env
44:00 - Req Object
46:10 - Marking Requests From Postman
47:28 - Simple Routing
51:52 - Loading Files
59:45 - Building a Simple API
1:10:27 - Middleware
1:13:24 - Cleanup (Middleware & Handlers)
1:19:08 - Get Req Body For POST
1:24:20 - File System Module
1:33:43 - Path Module
1:39:50 - OS Module
1:42:13 - URL Module
1:47:46 - Crypto Module
1:54:08 - Emitting Events
1:59:04 - Process Object
`,
  },
  {
    slug: "youtube-git-github-crash-course-2025-traversy",
    title: "Git & GitHub Crash Course 2025",
    shortDescription: "Official Traversy Media Git and GitHub course split by YouTube timestamps.",
    sourceYoutubeId: "vA5TTz6BXhY",
    sourceYoutubeUrl: "https://www.youtube.com/watch?v=vA5TTz6BXhY",
    durationSeconds: 2969,
    instructorKey: "traversy",
    level: "BEGINNER",
    tags: ["youtube", "git", "github", "developer-tools"],
    learningOutcomes: ["Learn Git and GitHub from the official Traversy Media video"],
    timestamps: `
0:00 - Intro
1:08 - What Is Git? (Slides)
4:35 - What Is GitHub?
7:36 - Git Workflow Overview
11:25 - Installation & Config
13:20 - Sample Project Files
14:49 - git init
16:17 - git status
16:30 - git add
17:25 - git commit
18:10 - Making Changes
19:10 - git log
19:56 - Create A Github Repo
21:50 - git remote
22:48 - git push
23:30 - Readme File
25:10 - git pull
25:45 - .gitignore File
27:31 - Commit Shortcuts
29:30 - GIthub Interface Basics
34:00 - SSH Keys
38:00 - git clone
39:00 - Branching
42:14 - Pull Requests
45:09 - Merging
46:12 - CI/CD Pipeline With Vercel
`,
  },
  {
    slug: "youtube-vuejs-crash-course-traversy",
    title: "Vue.js Crash Course",
    shortDescription: "Official Traversy Media Vue.js Crash Course split by YouTube timestamps.",
    sourceYoutubeId: "VeNfHj6MhgA",
    sourceYoutubeUrl: "https://www.youtube.com/watch?v=VeNfHj6MhgA",
    durationSeconds: 10604,
    instructorKey: "traversy",
    level: "INTERMEDIATE",
    tags: ["youtube", "vue", "frontend", "javascript"],
    learningOutcomes: ["Build a Vue.js project from the official Traversy Media video"],
    timestamps: `
0:00 - Intro
2:19 - Daily.dev Sponsor
3:11 - What is Vue.js?
4:45 - Prerequisites
6:17 - Role of Frontend Frameworks
8:40 - Why Vue.js?
11:14 - Vue Components
13:39 - Getting Setup
15:40 - Using The Vue CDN
20:54 - Create-Vue Setup
22:30 - Vue Official Extension
22:58 - Exploring Folders & Files
26:10 - Boilerplate Clean Up
26:50 - Component Structure
27:25 - Options API data() & Interpolation
28:36 - v-if, v-else & v-else-if Directives
30:43 - v-for Directive & Looping
32:17 - v-bind Directive
33:36 - v-on Directive, Events & Methods
35:55 - Composition API - Long Form
39:08 - ref() & Reactive Values
40:35 - Composition API Short Form
42:41 - Forms & v-model
46:38 - Delete task
48:36 - Lifecycle Methods
49:50 - onMounted & Fetching Data
51:58 - Vue Jobs Project Start
52:26 - Tailwind CSS Setup
56:47 - Theme Files & Images
58:16 - Navbar Component
1:01:20 - Hero Component
1:02:30 - Props
1:04:57 - HomeCards & Card Container Component
1:10:20 - JobListings Component & JSON Data
1:16:47 - JobListing Component
1:20:53 - JobListings Limit & showButton Props
1:24:26 - computed() & Truncate Description
1:30:41 - PrimeIcons
1:32:35 - Vue Router & Home View
1:39:52 - Jobs View
1:41:55 - RouterLink
1:46:07 - Navbar Active Link
1:50:42 - Not Found Page
1:56:27 - JSON Server REST API
1:59:50 - Fetch Data For JobListings
2:03:42 - reactive() Function
2:05:15 - JobListings Refactor To reactive()
2:07:26 - Vue Spinner
2:09:50 - Fetch Single Job & Display Data
2:19:06 - BackButton Component
2:21:03 - Proxying
2:23:54 - Add Job Page
2:32:20 - Save Job POST
2:37:15 - Toast Notifications
2:40:08 - Delete Job
2:44:14 - Edit Page
2:47:06 - Fetch Job To Edit
2:50:58 - Update Job
2:52:50 - Netlify Deployment
`,
  },
  {
    slug: "youtube-cursor-crash-course-traversy",
    title: "Cursor Crash Course & AI Coding For Beginners",
    shortDescription: "Official Traversy Media Cursor course split by YouTube timestamps.",
    sourceYoutubeId: "5zR1ZE5aqho",
    sourceYoutubeUrl: "https://www.youtube.com/watch?v=5zR1ZE5aqho",
    durationSeconds: 3161,
    instructorKey: "traversy",
    level: "BEGINNER",
    tags: ["youtube", "cursor", "ai", "developer-tools"],
    learningOutcomes: ["Learn Cursor and AI coding from the official Traversy Media video"],
    timestamps: `
0:00 - Intro
2:14 - Sponsor
3:13 - What Is Cursor?
3:59 - Cursor Pricing
6:58 - Context
7:58 - Settings
8:30 - Agent vs Ask Mode
10:30 - Models
11:51 - User Rules
14:17 - Using Cursor With Existing Projects
15:18 - Tab Completion
19:02 - Inline AI Edit
22:54 - Chat Interface
24:28 - Inline Quick Question
25:44 - Generating Projects From Scratch
30:20 - Follow-Up Changes
34:31 - Keeping a Changelog
36:14 - Lighthouse Report
37:05 - Project Context File
39:43 - Add Project Rules
42:20 - Create Next.js Project
49:50 - Add PDF Export
`,
  },
  {
    slug: "youtube-python-full-course-mosh",
    title: "Python Full Course for Beginners",
    shortDescription: "Official Programming with Mosh Python course split by YouTube timestamps.",
    sourceYoutubeId: "_uQrJ0TkZlc",
    sourceYoutubeUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
    durationSeconds: 22447,
    instructorKey: "mosh",
    level: "BEGINNER",
    tags: ["youtube", "python", "programming", "beginner"],
    learningOutcomes: ["Learn Python from the official Programming with Mosh video"],
    timestamps: `
00:00:00 Introduction
00:01:49 Installing Python 3
00:06:10 Your First Python Program
00:08:11 How Python Code Gets Executed
00:11:24 How Long It Takes To Learn Python
00:13:03 Variables
00:18:21 Receiving Input
00:22:16 Python Cheat Sheet
00:22:46 Type Conversion
00:29:31 Strings
00:37:36 Formatted Strings
00:40:50 String Methods
00:48:33 Arithmetic Operations
00:51:33 Operator Precedence
00:55:04 Math Functions
00:58:17 If Statements
01:06:32 Logical Operators
01:11:25 Comparison Operators
01:16:17 Weight Converter Program
01:20:43 While Loops
01:24:07 Building a Guessing Game
01:30:51 Building the Car Game
01:41:48 For Loops
01:47:46 Nested Loops
01:55:50 Lists
02:01:45 2D Lists
02:05:11 My Complete Python Course
02:06:00 List Methods
02:13:25 Tuples
02:15:34 Unpacking
02:18:21 Dictionaries
02:26:21 Emoji Converter
02:30:31 Functions
02:35:21 Parameters
02:39:24 Keyword Arguments
02:44:45 Return Statement
02:48:55 Creating a Reusable Function
02:53:42 Exceptions
02:59:14 Comments
03:01:46 Classes
03:07:46 Constructors
03:14:41 Inheritance
03:19:33 Modules
03:30:12 Packages
03:36:22 Generating Random Values
03:44:37 Working with Directories
03:50:47 Pypi and Pip
03:55:34 Project 1: Automation with Python
04:10:22 Project 2: Machine Learning with Python
04:58:37 Project 3: Building a Website with Django
`,
  },
];

const timePattern = /^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*(?:[-|:—–•]\s*)?(.*?)\s*$/;

function parseTimeToSeconds(value) {
  const parts = value.trim().split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((part) => /^\d+$/.test(part))) return null;
  const nums = parts.map(Number);
  if (nums.length === 2) {
    const [minutes, seconds] = nums;
    if (seconds > 59) return null;
    return minutes * 60 + seconds;
  }
  const [hours, minutes, seconds] = nums;
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function parseTimestampSections(text, durationSeconds) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(timePattern);
      if (!match) return null;
      const startSeconds = parseTimeToSeconds(match[1]);
      if (startSeconds == null) return null;
      return { startSeconds, title: match[2]?.trim() || "" };
    })
    .filter(Boolean)
    .sort((a, b) => a.startSeconds - b.startSeconds);

  const unique = rows.filter((row, index, arr) => index === 0 || row.startSeconds !== arr[index - 1].startSeconds);

  return unique.map((row, index) => ({
    title: row.title || `Section ${index + 1}`,
    order: index + 1,
    startSeconds: row.startSeconds,
    endSeconds: unique[index + 1]?.startSeconds ?? durationSeconds,
  }));
}

function coverFor(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

async function upsertInstructor(data) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      role: "INSTRUCTOR",
      status: "ACTIVE",
    },
    create: {
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });
}

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "programming" },
    update: { name: "Programming" },
    create: {
      name: "Programming",
      slug: "programming",
      description: "Real YouTube programming courses",
    },
  });

  const instructorRows = {};
  for (const [key, instructor] of Object.entries(instructors)) {
    instructorRows[key] = await upsertInstructor(instructor);
  }

  for (const courseData of courses) {
    const sections = parseTimestampSections(courseData.timestamps, courseData.durationSeconds);
    const coverImage = coverFor(courseData.sourceYoutubeId);
    const instructor = instructorRows[courseData.instructorKey];

    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: {
        title: courseData.title,
        description: `Official YouTube course from ${instructor.name}: ${courseData.sourceYoutubeUrl}`,
        shortDescription: courseData.shortDescription,
        thumbnailUrl: coverImage,
        coverImage,
        previewVideoUrl: courseData.sourceYoutubeUrl,
        sourceType: "YOUTUBE",
        sourceYoutubeId: courseData.sourceYoutubeId,
        sourceYoutubeUrl: courseData.sourceYoutubeUrl,
        durationSeconds: courseData.durationSeconds,
        duration: Math.ceil(courseData.durationSeconds / 60),
        level: courseData.level,
        language: "en",
        price: 0,
        currency: "MNT",
        status: "PUBLISHED",
        tags: courseData.tags,
        prerequisites: [],
        learningOutcomes: courseData.learningOutcomes,
        isFeatured: true,
        publishedAt: new Date(),
        instructorId: instructor.id,
        categoryId: category.id,
      },
      create: {
        slug: courseData.slug,
        title: courseData.title,
        description: `Official YouTube course from ${instructor.name}: ${courseData.sourceYoutubeUrl}`,
        shortDescription: courseData.shortDescription,
        thumbnailUrl: coverImage,
        coverImage,
        previewVideoUrl: courseData.sourceYoutubeUrl,
        sourceType: "YOUTUBE",
        sourceYoutubeId: courseData.sourceYoutubeId,
        sourceYoutubeUrl: courseData.sourceYoutubeUrl,
        durationSeconds: courseData.durationSeconds,
        duration: Math.ceil(courseData.durationSeconds / 60),
        level: courseData.level,
        language: "en",
        price: 0,
        currency: "MNT",
        status: "PUBLISHED",
        tags: courseData.tags,
        prerequisites: [],
        learningOutcomes: courseData.learningOutcomes,
        isFeatured: true,
        publishedAt: new Date(),
        instructorId: instructor.id,
        categoryId: category.id,
      },
    });

    await prisma.courseSection.deleteMany({ where: { courseId: course.id } });
    await prisma.courseSection.createMany({
      data: sections.map((section) => ({
        courseId: course.id,
        title: section.title,
        order: section.order,
        startSeconds: section.startSeconds,
        endSeconds: section.endSeconds,
      })),
    });

    console.log(`${course.title}: ${sections.length} sections, video ${course.sourceYoutubeId}, channel ${instructor.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
