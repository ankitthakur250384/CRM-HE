export function TestDashboard() {
  console.log('🧪 TestDashboard component is rendering');
  
  return (
    <div className="p-8">
      <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-yellow-800 mb-4">🧪 TEST DASHBOARD</h1>
        <p className="text-2xl text-yellow-700">This is a simple test dashboard component</p>
        <p className="text-lg text-yellow-600 mt-4">If you can see this, React routing is working!</p>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-bold text-blue-800">Test Card 1</h3>
          <p className="text-blue-600">This tests basic CSS grid layout</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-bold text-green-800">Test Card 2</h3>
          <p className="text-green-600">This tests Tailwind CSS classes</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-bold text-purple-800">Test Card 3</h3>
          <p className="text-purple-600">This tests component rendering</p>
        </div>
      </div>
    </div>
  );
}
