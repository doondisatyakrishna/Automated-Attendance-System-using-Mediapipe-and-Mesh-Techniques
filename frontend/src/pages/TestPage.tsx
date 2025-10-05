import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="bg-blue-500 p-10 min-h-screen">
      <h1 className="text-white text-4xl font-bold mb-4">This is a Test Page</h1>
      <p className="text-yellow-300 text-lg">
        If you can see this text on a blue background, then your Tailwind setup is working correctly.
      </p>

      <div className="mt-8 bg-red-500 h-48 w-48 flex items-center justify-center rounded-lg shadow-2xl">
        <span className="text-white font-bold text-2xl">Red Box</span>
      </div>
    </div>
  );
};

export default TestPage;