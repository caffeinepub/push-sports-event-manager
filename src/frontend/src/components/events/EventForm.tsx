import { useState } from 'react';
import type { EventFormData } from '../../utils/eventAdapter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import VoiceInputButton from './VoiceInputButton';

interface EventFormProps {
  initialData: EventFormData;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const SPORT_OPTIONS = ['Cricket', 'Badminton', 'Football', 'Volleyball', 'Basketball', 'Tennis'];

export default function EventForm({ initialData, onSubmit, onCancel, isSubmitting }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
  const [customSport, setCustomSport] = useState('');

  const pendingAmount = Math.max(0, formData.totalAmount - formData.advancePaid);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.eventName.trim()) newErrors.eventName = 'Event name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.organizerName.trim()) newErrors.organizerName = 'Organizer name is required';
    if (!formData.organizerPhone.trim()) newErrors.organizerPhone = 'Phone number is required';
    if (formData.totalAmount < 0) newErrors.totalAmount = 'Total amount must be positive';
    if (formData.advancePaid < 0) newErrors.advancePaid = 'Advance paid must be positive';
    if (formData.advancePaid > formData.totalAmount) newErrors.advancePaid = 'Advance cannot exceed total';
    if (formData.sports.length === 0) newErrors.sports = 'Select at least one sport';
    if (formData.eventDateTo < formData.eventDateFrom) newErrors.eventDateTo = 'End date cannot be before start date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleVoiceInput = (parsedData: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...parsedData }));
  };

  const toggleSport = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport],
    }));
  };

  const addCustomSport = () => {
    const trimmed = customSport.trim();
    if (trimmed && !formData.sports.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        sports: [...prev.sports, trimmed],
      }));
      setCustomSport('');
    }
  };

  const removeSport = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.filter(s => s !== sport),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <VoiceInputButton onParsed={handleVoiceInput} />

      <div className="space-y-4">
        <h3 className="font-semibold">Basic Details</h3>
        
        <div className="space-y-2">
          <Label htmlFor="eventName">Event Name *</Label>
          <Input
            id="eventName"
            value={formData.eventName}
            onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
            placeholder="e.g., Cricket Tournament"
          />
          {errors.eventName && <p className="text-sm text-destructive">{errors.eventName}</p>}
        </div>

        <div className="space-y-2">
          <Label>Sports *</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.sports.map(sport => (
              <Badge key={sport} variant="secondary" className="gap-1">
                {sport}
                <button
                  type="button"
                  onClick={() => removeSport(sport)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SPORT_OPTIONS.map(sport => (
              <div key={sport} className="flex items-center space-x-2">
                <Checkbox
                  id={`sport-${sport}`}
                  checked={formData.sports.includes(sport)}
                  onCheckedChange={() => toggleSport(sport)}
                />
                <Label htmlFor={`sport-${sport}`} className="text-sm cursor-pointer">
                  {sport}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add custom sport"
              value={customSport}
              onChange={(e) => setCustomSport(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSport();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addCustomSport}>
              Add
            </Button>
          </div>
          {errors.sports && <p className="text-sm text-destructive">{errors.sports}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventDateFrom">From Date *</Label>
            <Input
              id="eventDateFrom"
              type="date"
              value={formData.eventDateFrom.toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, eventDateFrom: new Date(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventDateTo">To Date *</Label>
            <Input
              id="eventDateTo"
              type="date"
              value={formData.eventDateTo.toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, eventDateTo: new Date(e.target.value) })}
            />
            {errors.eventDateTo && <p className="text-sm text-destructive">{errors.eventDateTo}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Event Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Sports Complex, Main Ground"
          />
          {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold">Organizer Details</h3>
        
        <div className="space-y-2">
          <Label htmlFor="organizerName">Organizer Name *</Label>
          <Input
            id="organizerName"
            value={formData.organizerName}
            onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
            placeholder="e.g., Rahul Kumar"
          />
          {errors.organizerName && <p className="text-sm text-destructive">{errors.organizerName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizerPhone">Phone Number *</Label>
          <Input
            id="organizerPhone"
            type="tel"
            value={formData.organizerPhone}
            onChange={(e) => setFormData({ ...formData, organizerPhone: e.target.value })}
            placeholder="e.g., +91 98765 43210"
          />
          {errors.organizerPhone && <p className="text-sm text-destructive">{errors.organizerPhone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizerEmail">Email (Optional)</Label>
          <Input
            id="organizerEmail"
            type="email"
            value={formData.organizerEmail}
            onChange={(e) => setFormData({ ...formData, organizerEmail: e.target.value })}
            placeholder="e.g., organizer@example.com"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold">Financial Details</h3>
        
        <div className="space-y-2">
          <Label htmlFor="totalAmount">Total Event Amount (₹) *</Label>
          <Input
            id="totalAmount"
            type="number"
            min="0"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
          />
          {errors.totalAmount && <p className="text-sm text-destructive">{errors.totalAmount}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="advancePaid">Advance Paid (₹) *</Label>
          <Input
            id="advancePaid"
            type="number"
            min="0"
            value={formData.advancePaid}
            onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
          />
          {errors.advancePaid && <p className="text-sm text-destructive">{errors.advancePaid}</p>}
        </div>

        <div className="p-4 bg-accent/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Pending Amount</span>
            <span className={`text-lg font-bold ${pendingAmount > 0 ? 'text-destructive' : 'text-chart-4'}`}>
              ₹{pendingAmount}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold">Requirements</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.requirements).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={value}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    requirements: { ...formData.requirements, [key]: checked === true },
                  })
                }
              />
              <Label htmlFor={key} className="text-sm cursor-pointer">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold">Other Details</h3>
        
        <div className="space-y-2">
          <Label htmlFor="specialNotes">Special Notes</Label>
          <Textarea
            id="specialNotes"
            value={formData.specialNotes}
            onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
            placeholder="Any special requirements or notes..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Event Status</Label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Event'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
