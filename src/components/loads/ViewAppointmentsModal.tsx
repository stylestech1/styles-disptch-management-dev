import Modal from '@/components/ui/Modals';
import { TLoads } from '@/types/globalTypes';
import {
  IoLocationOutline,
  IoCheckmark,
  IoTime,
  IoCar,
} from 'react-icons/io5';
import { LiaShippingFastSolid } from 'react-icons/lia';

interface ViewAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLoad: TLoads | null;
}

const ViewAppointmentsModal: React.FC<ViewAppointmentsModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedLoad 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`All Appointments - (${selectedLoad?.loadId || 'N/A'})`}
      size="xl"
      closeOnOutsideClick={false}
    >
      <div className="overflow-y-auto">
        {selectedLoad ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-5">
              <h2 className="font-bold text-gray-500">Appointment</h2>
              <div className="w-full h-px bg-gray-200"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pickup Appointment */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <IoLocationOutline className="text-blue-600" size={18} />
                  <h4 className="font-semibold text-blue-800">
                    Pickup Appointment
                  </h4>
                </div>
                <p className="text-blue-700">
                  {selectedLoad.pickupAtFrom
                    ? new Date(selectedLoad.pickupAtFrom).toLocaleString()
                    : 'Not scheduled'}
                </p>
              </div>

              {/* Delivery Appointment */}
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <IoCheckmark className="text-green-600" size={18} />
                  <h4 className="font-semibold text-green-800">
                    Delivery Appointment
                  </h4>
                </div>
                <p className="text-green-700">
                  {selectedLoad.completedAt
                    ? new Date(selectedLoad.completedAt).toLocaleString()
                    : 'Not scheduled'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <h2 className="font-bold text-gray-500">Arrivals</h2>
              <div className="w-full h-px bg-gray-200"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Arrival at Shipper */}
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <IoTime className="text-amber-600" size={18} />
                  <h4 className="font-semibold text-amber-800">
                    Arrival at Shipper
                  </h4>
                </div>
                <p className="text-amber-700">
                  {selectedLoad.pickupAtTo
                    ? new Date(selectedLoad.pickupAtTo).toLocaleString()
                    : 'Not recorded'}
                </p>
              </div>

              {/* Arrival at Receiver */}
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <IoTime className="text-purple-600" size={18} />
                  <h4 className="font-semibold text-purple-800">
                    Arrival at Receiver
                  </h4>
                </div>
                <p className="text-purple-700">
                  {selectedLoad.arrivalAtReceiver
                    ? new Date(selectedLoad.arrivalAtReceiver).toLocaleString()
                    : 'Not recorded'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <h2 className="font-bold text-gray-500">Lefts</h2>
              <div className="w-full h-px bg-gray-200"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Shipper */}
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <IoCar className="text-orange-600" size={18} />
                  <h4 className="font-semibold text-orange-800">
                    Left Shipper
                  </h4>
                </div>
                <p className="text-orange-700">
                  {selectedLoad.leftShipper
                    ? new Date(selectedLoad.leftShipper).toLocaleString()
                    : 'Not recorded'}
                </p>
              </div>

              {/* Left Receiver */}
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <IoCar className="text-red-600" size={18} />
                  <h4 className="font-semibold text-red-800">
                    Left Receiver
                  </h4>
                </div>
                <p className="text-red-700">
                  {selectedLoad.leftReceiver
                    ? new Date(selectedLoad.leftReceiver).toLocaleString()
                    : 'Not recorded'}
                </p>
              </div>
            </div>

            {/* Delivered At */}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <IoCheckmark className="text-emerald-600" size={18} />
                <h4 className="font-semibold text-emerald-800">
                  Completed By Dispatcher At
                </h4>
              </div>
              <p className="text-emerald-700">
                {selectedLoad.deliveredAt
                  ? `${new Date(
                      selectedLoad.deliveredAt
                    ).toLocaleString()} ---> (${selectedLoad.updatedBy})`
                  : 'Not delivered'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-300">
              <LiaShippingFastSolid size={32} className="text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-700 mb-2">
              No Load Selected
            </h4>
            <p className="text-slate-500 text-sm max-w-xs">
              Please select a load to view its appointments.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewAppointmentsModal;