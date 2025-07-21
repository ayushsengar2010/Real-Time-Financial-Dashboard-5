import React from 'react';
import { BookOpen, Users, ExternalLink, GraduationCap, ArrowRight } from 'lucide-react';

const learningPaths = [
  {
    level: 'Beginner',
    title: 'Stock Market Basics',
    description: 'Understand the fundamentals of how the stock market works, from stocks and bonds to ETFs.',
    link: 'https://www.investopedia.com/articles/basics/06/invest1000.asp',
    icon: '📘'
  },
  {
    level: 'Intermediate',
    title: 'Technical Analysis 101',
    description: 'Learn to read candlestick charts, identify patterns, and use indicators to make trading decisions.',
    link: 'https://www.youtube.com/watch?v=FNy2w_3gC5Y',
    icon: '📈'
  },
  {
    level: 'Advanced',
    title: 'Options & Derivatives',
    description: 'Dive into advanced financial instruments, strategies, and risk management techniques.',
    link: 'https://www.khanacademy.org/economics-finance-domain/core-finance/derivative-securities',
    icon: '🎓'
  },
];

const communityCourses = [
  {
    title: 'Value Investing Masterclass',
    link: '#',
    submittedBy: 'WarrenB',
    level: 'Intermediate',
  },
  {
    title: 'Crypto Trading for Beginners',
    link: '#',
    submittedBy: 'SatoshiN',
    level: 'Beginner',
  },
];

const trustedResources = [
  { name: 'Investopedia', link: 'https://www.investopedia.com/', icon: <BookOpen /> },
  { name: 'NSE Academy', link: 'https://www.nseindia.com/learn', icon: <GraduationCap /> },
  { name: 'Khan Academy (Finance)', link: 'https://www.khanacademy.org/economics-finance-domain', icon: <GraduationCap /> },
  { name: 'TradingView Education', link: 'https://www.tradingview.com/education/', icon: <ExternalLink /> },
];

const Learn = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Learn About Investing</h1>

      {/* Featured Learning Paths */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center">
          <BookOpen className="mr-3 text-indigo-600" /> Featured Learning Paths
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learningPaths.map((path, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200 flex flex-col">
              <div className="text-4xl mb-4">{path.icon}</div>
              <span className="text-sm font-semibold text-indigo-600 mb-1">{path.level}</span>
              <h3 className="text-xl font-bold mb-2">{path.title}</h3>
              <p className="text-gray-600 flex-grow mb-4">{path.description}</p>
              <a href={path.link} target="_blank" rel="noopener noreferrer" className="mt-auto bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition duration-300">
                Start Learning <ArrowRight className="ml-2" size={16} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Community Courses */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 flex items-center">
          <Users className="mr-3 text-teal-600" /> Community Courses
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Add resource button can be added here */}
          <ul className="space-y-4">
            {communityCourses.map((course, index) => (
              <li key={index} className="border-b pb-4 last:border-b-0">
                <a href={course.link} className="text-lg font-semibold text-indigo-700 hover:underline">{course.title}</a>
                <div className="text-sm text-gray-500">
                  Submitted by: {course.submittedBy} | <span className="font-semibold">{course.level}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Trusted Resources */}
      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center">
          <ExternalLink className="mr-3 text-green-600" /> Trusted Resources
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustedResources.map((resource, index) => (
            <a key={index} href={resource.link} target="_blank" rel="noopener noreferrer" className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl flex items-center justify-center flex-col text-center hover:scale-105 transition-transform duration-200">
              <div className="text-indigo-600 mb-2">{React.cloneElement(resource.icon, { size: 32 })}</div>
              <span className="font-semibold">{resource.name}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Learn; 