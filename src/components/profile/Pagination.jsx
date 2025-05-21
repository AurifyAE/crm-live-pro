import React from "react";
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  currentPage,
  totalPages,
  paginate,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      <div className="flex items-center text-sm text-gray-700 mb-4 md:mb-0">
        <span>Showing </span>
        <select
          value={itemsPerPage}
          onChange={(e) => { setItemsPerPage(Number(e.target.value)); paginate(1); }}
          className="mx-1 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>of <span className="font-medium">{totalItems}</span> results</span>
      </div>
      <div className="flex items-center justify-center space-x-1">
        <button
          onClick={() => paginate(1)}
          disabled={currentPage === 1}
          className={`px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) pageNum = i + 1;
          else if (currentPage <= 3) pageNum = i + 1;
          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
          else pageNum = currentPage - 2 + i;
          return (
            <button
              key={pageNum}
              onClick={() => paginate(pageNum)}
              className={`px-4 py-2 border ${currentPage === pageNum ? "bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"} text-sm font-medium`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages}
          className={`px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;