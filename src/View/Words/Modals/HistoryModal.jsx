import Button from "../../../components/UI/Button";
import {
  IoTimeOutline,
  IoPersonOutline,
  IoPencilOutline,
  IoCheckmark,
} from "react-icons/io5";

const HistoryModal = ({ isOpen, onClose, creator, modifiers }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 border-2 border-gray-200/50">
        <h3 className="flex items-center justify-center gap-2 text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          <IoTimeOutline className="text-blue-600" aria-hidden="true" />
          Edit History
        </h3>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 p-4 rounded-2xl border border-green-200/30">
            <strong className="text-green-700 font-semibold text-lg flex items-center gap-2">
              <IoPersonOutline aria-hidden="true" /> Created by:
            </strong>
            <div className="mt-2 ml-6">
              <p className="text-gray-800 font-medium">
                {creator.name || "Unknown"}
              </p>
              {creator.email && (
                <p className="text-gray-500 text-sm mt-1">{creator.email}</p>
              )}
            </div>
          </div>

          {modifiers?.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 p-4 rounded-2xl border border-blue-200/30">
              <strong className="text-blue-700 font-semibold text-lg flex items-center gap-2">
                <IoPencilOutline aria-hidden="true" /> Modified by:
              </strong>
              <div className="mt-3 space-y-2 ml-6">
                {modifiers.map((modifier, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <div>
                      <p className="text-gray-800 font-medium">
                        {modifier.name || "Unknown"}
                      </p>
                      {modifier.email && (
                        <p className="text-gray-500 text-sm">
                          {modifier.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={onClose}>
          <IoCheckmark aria-hidden="true" /> Close
        </Button>
      </div>
    </div>
  );
};

export default HistoryModal;
