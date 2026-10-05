import 'dotenv/config';
import mongoose from 'mongoose';
import { Course } from '../models/Course';
import { Lesson } from '../models/Lesson';

const COURSE_ID = new mongoose.Types.ObjectId('6abd963147cb4e17ec58e026');
const INSTRUCTOR_ID = new mongoose.Types.ObjectId('6a5572fb6655947a911dbe33');

const SAMPLE_VIDEOS = [
  'https://res.cloudinary.com/demo/video/upload/dog.mp4',
  'https://res.cloudinary.com/demo/video/upload/elephants.mp4',
  'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4',
  'https://res.cloudinary.com/demo/video/upload/dog.mp4',
];
const SAMPLE_PDF = 'http://localhost:5173/media/sample-lesson.pdf';

type SeedLesson = {
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'slides' | 'quiz';
  durationSeconds: number;
  isPreview?: boolean;
};

const lessonPlan: SeedLesson[] = [
  { title: 'Welcome and what you will build', description: 'A tour of the course, the datasets we will use, and the project you will finish with.', contentType: 'video', durationSeconds: 320, isPreview: true },
  { title: 'Setting up Python, pip and a virtual environment', description: 'Installing Python 3, creating an isolated environment, and why you should never install packages globally.', contentType: 'video', durationSeconds: 540, isPreview: true },
  { title: 'Jupyter notebooks: your lab bench', description: 'Cells, kernels, keyboard shortcuts, and how to keep a notebook reproducible.', contentType: 'video', durationSeconds: 480, isPreview: true },
  { title: 'Python refresher: variables, types and control flow', description: 'The language fundamentals we lean on for the rest of the course.', contentType: 'video', durationSeconds: 760 },
  { title: 'Functions, modules and the standard library', description: 'Writing reusable functions and importing from the batteries-included standard library.', contentType: 'video', durationSeconds: 690 },
  { title: 'Lists, dictionaries and comprehensions', description: 'The data structures you will reach for daily, plus comprehension syntax.', contentType: 'video', durationSeconds: 620 },
  { title: 'Reading files: CSV, JSON and text', description: 'Getting data off disk safely, with encodings and context managers.', contentType: 'video', durationSeconds: 540 },
  { title: 'Course cheat sheet', description: 'A printable reference of the syntax, functions and methods used throughout.', contentType: 'pdf', durationSeconds: 300 },
  { title: 'NumPy arrays and vectorised thinking', description: 'Why array operations beat loops, and how broadcasting works.', contentType: 'video', durationSeconds: 820 },
  { title: 'Indexing, slicing and reshaping arrays', description: 'Selecting exactly the data you need without copying it.', contentType: 'video', durationSeconds: 700 },
  { title: 'Pandas Series and DataFrames', description: 'The two structures at the heart of analysis work in Python.', contentType: 'video', durationSeconds: 880 },
  { title: 'Loading, inspecting and cleaning a messy dataset', description: 'Missing values, wrong dtypes, duplicate rows and inconsistent labels.', contentType: 'video', durationSeconds: 960 },
  { title: 'Filtering, sorting and selecting with loc and iloc', description: 'Label-based and position-based selection, and when each is right.', contentType: 'video', durationSeconds: 720 },
  { title: 'Grouping and aggregation', description: 'Split-apply-combine, the pattern behind most analytical questions.', contentType: 'video', durationSeconds: 840 },
  { title: 'Joining and reshaping data', description: 'Merges, pivots and melts, with the join types drawn out.', contentType: 'slides', durationSeconds: 600 },
  { title: 'Dates, times and time series basics', description: 'Parsing timestamps, resampling, and rolling windows.', contentType: 'video', durationSeconds: 780 },
  { title: 'Plotting with Matplotlib', description: 'Figures, axes, and building a chart that is actually readable.', contentType: 'video', durationSeconds: 820 },
  { title: 'Statistical plots with Seaborn', description: 'Distributions, relationships and categorical comparisons in a few lines.', contentType: 'video', durationSeconds: 740 },
  { title: 'Telling the story: from analysis to a report', description: 'Choosing the right chart, writing the finding, and avoiding misleading scales.', contentType: 'slides', durationSeconds: 660 },
  { title: 'Capstone: analysing a real dataset end to end', description: 'Load, clean, explore, visualise and write up a conclusion, start to finish.', contentType: 'video', durationSeconds: 1200 },
];

function buildContent(plan: SeedLesson, index: number) {
  if (plan.contentType === 'video') {
    return { video: { url: SAMPLE_VIDEOS[index % SAMPLE_VIDEOS.length], provider: 'self' as const } };
  }

  if (plan.contentType === 'pdf') {
    return { pdf: { url: SAMPLE_PDF, pageCount: 12 } };
  }

  if (plan.contentType === 'slides') {
    return { slides: { url: SAMPLE_PDF, slideCount: 24 } };
  }

  return {};
}

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Run this from the server folder with your .env in place.');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const totalDurationSeconds = lessonPlan.reduce((sum, plan) => sum + plan.durationSeconds, 0);

  await Course.updateOne(
    { _id: COURSE_ID },
    {
      $set: {
        title: 'Python for Data Science',
        slug: 'python-for-data-science',
        description:
          'Build a strong foundation in Python programming and learn how to use it for data analysis and visualization.',
        instructors: [INSTRUCTOR_ID],
        tags: ['Python', 'data science', 'Pandas', 'NumPy', 'data analysis'],
        category: 'Data Science',
        level: 'intermediate',
        language: 'en',
        price: 35000,
        currency: 'NGN',
        isFree: false,
        thumbnailUrl: 'https://placehold.co/800x450/png?text=Python+for+Data+Science',
        status: 'published',
        totalDurationSeconds,
      },
    },
    { upsert: true },
  );

  const removed = await Lesson.deleteMany({ course: COURSE_ID });
  console.log(`Removed ${removed.deletedCount} existing lesson(s)`);

  const documents = lessonPlan.map((plan, index) => ({
    course: COURSE_ID,
    title: plan.title,
    description: plan.description,
    order: index + 1,
    contentType: plan.contentType,
    isPreview: plan.isPreview ?? false,
    durationSeconds: plan.durationSeconds,
    ...buildContent(plan, index),
  }));

  const created = await Lesson.insertMany(documents);
  console.log(`Inserted ${created.length} lesson(s)`);

  await Course.updateOne(
    { _id: COURSE_ID },
    { $set: { lessons: created.map((lesson) => lesson._id) } },
  );

  console.log(
    `Done. ${created.length} lessons, ${Math.round(totalDurationSeconds / 60)} minutes total, ` +
      `${lessonPlan.filter((plan) => plan.isPreview).length} free previews.`,
  );

  await mongoose.connection.close();
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });