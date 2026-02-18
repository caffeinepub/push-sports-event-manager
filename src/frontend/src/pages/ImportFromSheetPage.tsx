import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useUpsertManyEvents } from '../hooks/useQueries';
import { parseCSV, normalizeHeaderName } from '../utils/csv';
import { mapCSVRowToEvent, type ColumnMapping, type MappingResult } from '../utils/sheetEventMapping';
import { Download, Upload, AlertCircle, CheckCircle2, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

const STORAGE_KEY_CSV_URL = 'push_sports_csv_url';
const STORAGE_KEY_EXTERNAL_ID_COL = 'push_sports_external_id_col';
const STORAGE_KEY_COLUMN_MAPPING = 'push_sports_column_mapping';

export default function ImportFromSheetPage() {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState<'url' | 'paste'>('url');
  const [csvUrl, setCsvUrl] = useState(() => localStorage.getItem(STORAGE_KEY_CSV_URL) || '');
  const [csvText, setCsvText] = useState('');
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COLUMN_MAPPING);
    return saved ? JSON.parse(saved) : {};
  });
  const [externalIdColumn, setExternalIdColumn] = useState(() => localStorage.getItem(STORAGE_KEY_EXTERNAL_ID_COL) || '');
  const [importUnmatched, setImportUnmatched] = useState(true);
  const [step, setStep] = useState<'input' | 'mapping' | 'preview'>('input');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const upsertMutation = useUpsertManyEvents();

  const handleFetchCSV = async () => {
    if (!csvUrl.trim()) {
      toast.error('Please enter a CSV URL');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Failed to fetch CSV');
      const text = await response.text();
      const parsed = parseCSV(text);
      setParsedCSV(parsed);
      localStorage.setItem(STORAGE_KEY_CSV_URL, csvUrl);
      setStep('mapping');
      toast.success('CSV loaded successfully');
    } catch (error: any) {
      toast.error(`Failed to fetch CSV: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteCSV = () => {
    if (!csvText.trim()) {
      toast.error('Please paste CSV content');
      return;
    }

    try {
      const parsed = parseCSV(csvText);
      setParsedCSV(parsed);
      setStep('mapping');
      toast.success('CSV parsed successfully');
    } catch (error: any) {
      toast.error(`Failed to parse CSV: ${error.message}`);
    }
  };

  const handleColumnMappingChange = (field: keyof ColumnMapping, value: string) => {
    const newMapping = { ...columnMapping, [field]: value };
    setColumnMapping(newMapping);
    localStorage.setItem(STORAGE_KEY_COLUMN_MAPPING, JSON.stringify(newMapping));
  };

  const handleExternalIdChange = (value: string) => {
    setExternalIdColumn(value);
    localStorage.setItem(STORAGE_KEY_EXTERNAL_ID_COL, value);
  };

  const handlePreview = () => {
    if (!parsedCSV) return;

    const requiredFields: Array<keyof ColumnMapping> = ['title', 'dateTimestamp'];
    const missingFields = requiredFields.filter(field => !columnMapping[field]);

    if (missingFields.length > 0) {
      toast.error(`Please map required fields: ${missingFields.join(', ')}`);
      return;
    }

    setStep('preview');
  };

  const handleImport = async () => {
    if (!parsedCSV) return;

    setIsLoading(true);
    const results: MappingResult[] = [];
    const errors: Array<{ row: number; reason: string }> = [];

    parsedCSV.rows.forEach((row, index) => {
      const result = mapCSVRowToEvent(row, parsedCSV.headers, columnMapping, externalIdColumn);
      if (result.success) {
        results.push(result);
      } else {
        errors.push({ row: index + 2, reason: result.error || 'Unknown error' });
      }
    });

    const eventsToImport = results
      .filter(r => r.success && r.event)
      .map(r => r.event!);

    try {
      await upsertMutation.mutateAsync(eventsToImport);
      
      const importSummary: ImportSummary = {
        created: eventsToImport.filter(e => !e.externalId).length,
        updated: eventsToImport.filter(e => e.externalId).length,
        skipped: errors.length,
        errors,
      };

      setSummary(importSummary);
      toast.success(`Import complete: ${importSummary.created} created, ${importSummary.updated} updated`);
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!csvUrl.trim()) {
      toast.error('No saved CSV URL found. Please import first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Failed to fetch CSV');
      const text = await response.text();
      const parsed = parseCSV(text);
      setParsedCSV(parsed);

      const results: MappingResult[] = [];
      const errors: Array<{ row: number; reason: string }> = [];

      parsed.rows.forEach((row, index) => {
        const result = mapCSVRowToEvent(row, parsed.headers, columnMapping, externalIdColumn);
        if (result.success) {
          results.push(result);
        } else {
          errors.push({ row: index + 2, reason: result.error || 'Unknown error' });
        }
      });

      let eventsToSync = results
        .filter(r => r.success && r.event)
        .map(r => r.event!);

      if (!importUnmatched) {
        eventsToSync = eventsToSync.filter(e => e.externalId);
      }

      await upsertMutation.mutateAsync(eventsToSync);

      const syncSummary: ImportSummary = {
        created: eventsToSync.filter(e => !e.externalId).length,
        updated: eventsToSync.filter(e => e.externalId).length,
        skipped: errors.length + (importUnmatched ? 0 : results.filter(r => !r.event?.externalId).length),
        errors,
      };

      setSummary(syncSummary);
      toast.success(`Sync complete: ${syncSummary.created} created, ${syncSummary.updated} updated`);
    } catch (error: any) {
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> To import from Google Sheets, you must publish your sheet to the web as CSV.
          <br />
          In Google Sheets: File → Share → Publish to web → Select "Comma-separated values (.csv)" → Publish
          <br />
          Copy the published CSV link and paste it below. Google OAuth login is not supported.
        </AlertDescription>
      </Alert>

      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'url' | 'paste')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">CSV URL</TabsTrigger>
          <TabsTrigger value="paste">Paste CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-url">Google Sheets CSV URL</Label>
            <Input
              id="csv-url"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={csvUrl}
              onChange={(e) => setCsvUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleFetchCSV} disabled={isLoading} className="w-full gap-2">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Fetch CSV
          </Button>
        </TabsContent>

        <TabsContent value="paste" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-text">Paste CSV Content</Label>
            <Textarea
              id="csv-text"
              placeholder="Paste your CSV content here..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
            />
          </div>
          <Button onClick={handlePasteCSV} className="w-full gap-2">
            <Upload className="h-4 w-4" />
            Parse CSV
          </Button>
        </TabsContent>
      </Tabs>

      {csvUrl && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold">Manual Sync</h3>
            <p className="text-sm text-muted-foreground">
              Re-fetch and sync events from your saved Google Sheet URL.
            </p>
            <div className="flex items-center gap-2">
              <Switch
                id="import-unmatched"
                checked={importUnmatched}
                onCheckedChange={setImportUnmatched}
              />
              <Label htmlFor="import-unmatched" className="text-sm">
                Import unmatched rows as new events
              </Label>
            </div>
            <Button onClick={handleSync} disabled={isLoading} variant="outline" className="w-full gap-2">
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync from Sheet
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const renderMappingStep = () => {
    if (!parsedCSV) return null;

    const fieldOptions = [
      { value: 'title', label: 'Event Title *', required: true },
      { value: 'dateTimestamp', label: 'Date/Time *', required: true },
      { value: 'attendees', label: 'Attendees' },
      { value: 'pricePerPerson', label: 'Price Per Person' },
      { value: 'flatFee', label: 'Flat Fee' },
      { value: 'amountPaid', label: 'Amount Paid' },
      { value: 'services', label: 'Services (comma-separated)' },
    ];

    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Map your CSV columns to event fields. Required fields are marked with *.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>External ID Column (for sync)</Label>
            <Select value={externalIdColumn} onValueChange={handleExternalIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select column for unique identifier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {parsedCSV.headers.map(header => (
                  <SelectItem key={header} value={header}>{header}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose a column with unique values to enable future sync updates
            </p>
          </div>

          <Separator />

          {fieldOptions.map(field => (
            <div key={field.value} className="space-y-2">
              <Label>{field.label}</Label>
              <Select
                value={columnMapping[field.value as keyof ColumnMapping] || ''}
                onValueChange={(value) => handleColumnMappingChange(field.value as keyof ColumnMapping, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select column for ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {parsedCSV.headers.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setStep('input')} variant="outline" className="flex-1">
            Back
          </Button>
          <Button onClick={handlePreview} className="flex-1">
            Preview
          </Button>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => {
    if (!parsedCSV) return null;

    const previewRows = parsedCSV.rows.slice(0, 5);
    const totalRows = parsedCSV.rows.length;

    return (
      <div className="space-y-6">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Preview of {previewRows.length} out of {totalRows} rows. Review and confirm import.
          </AlertDescription>
        </Alert>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                {Object.keys(columnMapping).filter(k => columnMapping[k as keyof ColumnMapping]).map(field => (
                  <TableHead key={field}>{field}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, index) => {
                const result = mapCSVRowToEvent(row, parsedCSV.headers, columnMapping, externalIdColumn);
                return (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    {Object.keys(columnMapping).filter(k => columnMapping[k as keyof ColumnMapping]).map(field => {
                      const colName = columnMapping[field as keyof ColumnMapping];
                      const colIndex = parsedCSV.headers.indexOf(colName || '');
                      return (
                        <TableCell key={field} className="max-w-[150px] truncate">
                          {colIndex >= 0 ? row[colIndex] : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setStep('mapping')} variant="outline" className="flex-1">
            Back
          </Button>
          <Button onClick={handleImport} disabled={isLoading} className="flex-1 gap-2">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import Events
          </Button>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (!summary) return null;

    return (
      <div className="space-y-6">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Import completed successfully!
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-chart-4">{summary.created}</p>
              <p className="text-sm text-muted-foreground">Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{summary.updated}</p>
              <p className="text-sm text-muted-foreground">Updated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{summary.skipped}</p>
              <p className="text-sm text-muted-foreground">Skipped</p>
            </CardContent>
          </Card>
        </div>

        {summary.errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Errors ({summary.errors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {summary.errors.map((error, index) => (
                  <div key={index} className="text-sm p-2 bg-destructive/10 rounded">
                    <span className="font-medium">Row {error.row}:</span> {error.reason}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button onClick={() => navigate({ to: '/' })} className="flex-1">
            Go to Dashboard
          </Button>
          <Button onClick={() => {
            setSummary(null);
            setStep('input');
          }} variant="outline" className="flex-1">
            Import More
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate({ to: '/' })} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Import from Google Sheets</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 'input' && 'Step 1: Load CSV'}
            {step === 'mapping' && 'Step 2: Map Columns'}
            {step === 'preview' && 'Step 3: Preview & Import'}
            {summary && 'Import Summary'}
          </CardTitle>
          <CardDescription>
            {step === 'input' && 'Fetch CSV from Google Sheets or paste CSV content'}
            {step === 'mapping' && 'Map your CSV columns to event fields'}
            {step === 'preview' && 'Review the data before importing'}
            {summary && 'Import results and error details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!summary && step === 'input' && renderInputStep()}
          {!summary && step === 'mapping' && renderMappingStep()}
          {!summary && step === 'preview' && renderPreviewStep()}
          {summary && renderSummary()}
        </CardContent>
      </Card>
    </div>
  );
}
