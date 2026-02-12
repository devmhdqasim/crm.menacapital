import React, { useState } from 'react';
import { X, Bell, Calendar, Clock } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const ReminderModal = ({ contact, onClose }) => {
  const [reminderTime, setReminderTime] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  const handleSetReminder = () => {
    if (!reminderTime) {
      toast.error('Please select a time');
      return;
    }

    const reminder = {
      id: Date.now(),
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      time: reminderTime,
      note: reminderNote,
      createdAt: new Date().toISOString(),
    };

    const existingReminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    existingReminders.push(reminder);
    localStorage.setItem('reminders', JSON.stringify(existingReminders));

    toast.success(`Reminder set for ${new Date(reminderTime).toLocaleString()}`);
    setReminderTime('');
    setReminderNote('');
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-2xl shadow-2xl w-full max-w-md border border-[#BBA473]/30 animate-scaleIn">
        <div className="p-5 border-b border-[#BBA473]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#BBA473]/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#BBA473]" />
              </div>
              <div>
                <h3 className="text-white font-bold">Set Follow-up Reminder</h3>
                <p className="text-gray-400 text-xs">Get notified to follow up with {contact.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-2 block font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#BBA473]" />
              When to remind you?
            </label>
            <div className="relative">
              <DatePicker
                selected={reminderTime ? new Date(reminderTime) : null}
                onChange={(date) => setReminderTime(date ? date.toISOString() : '')}
                showTimeSelect
                timeFormat="h:mm aa"
                timeIntervals={15}
                dateFormat="MMM d, yyyy h:mm aa"
                placeholderText="Select date and time"
                minDate={new Date()}
                className="w-full px-4 py-3 pl-11 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473] cursor-pointer"
                wrapperClassName="w-full"
                timeCaption="Time"
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BBA473] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-2 block font-medium">Note (optional)</label>
            <textarea
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
              placeholder="Add a note about this follow-up..."
              rows="3"
              className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white placeholder-gray-500 resize-none transition-all duration-300"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-gray-300 text-sm mb-2 block font-medium">Quick presets</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'In 1 hour', hours: 1 },
                { label: 'In 3 hours', hours: 3 },
                { label: 'Tomorrow 9 AM', tomorrow: true },
                { label: 'Next week', days: 7 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const date = new Date();
                    if (preset.hours) {
                      date.setHours(date.getHours() + preset.hours);
                    } else if (preset.tomorrow) {
                      date.setDate(date.getDate() + 1);
                      date.setHours(9, 0, 0, 0);
                    } else if (preset.days) {
                      date.setDate(date.getDate() + preset.days);
                    }
                    setReminderTime(date.toISOString());
                  }}
                  className="px-3 py-2 bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] rounded-lg text-xs font-medium transition-all duration-300 border border-[#BBA473]/20 hover:scale-105 active:scale-95"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[#BBA473]/20 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-xl transition-all duration-300 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSetReminder}
            disabled={!reminderTime}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] hover:from-[#d4bc89] hover:to-[#a69363] text-black rounded-xl transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;