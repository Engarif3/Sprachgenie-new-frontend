import React from "react";

const HistoryModal = ({ isOpen, onClose, creator, modifiers }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">History</h3>

        <div className="mb-4">
          <strong>Created by:</strong>
          <div className="mt-1">
            {creator.name || "Unknown"}
            {creator.email && (
              <span className="text-gray-600 text-sm ml-2">
                ({creator.email})
              </span>
            )}
          </div>
        </div>

        {modifiers?.length > 0 && (
          <div>
            <strong>Modified by:</strong>
            <div className="mt-2 space-y-1">
              {modifiers.map((modifier, index) => (
                <div key={index} className="flex items-baseline">
                  <span className="mr-2">•</span>
                  <span>
                    {modifier.name || "Unknown"}
                    {modifier.email && (
                      <span className="text-gray-600 text-sm ml-2">
                        ({modifier.email})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default HistoryModal;
