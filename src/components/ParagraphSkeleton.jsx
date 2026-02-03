// Skeleton loader for paragraph generation
const ParagraphSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-3/4"></div>
    <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-full"></div>
    <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-5/6"></div>
    <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-4/5"></div>
    <div className="flex gap-2 mt-4">
      <div className="h-8 bg-gray-700 rounded-full w-20"></div>
      <div className="h-8 bg-gray-700 rounded-full w-24"></div>
    </div>
  </div>
);

export default ParagraphSkeleton;
