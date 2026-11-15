'use client';

import React from 'react';
import Card from '@/components/Card';
import AdherenceInsightsCard from '@/components/AdherenceInsightsCard';
import RefillPredictionWidget from '@/components/RefillPredictionWidget';
import { CaregiverMedication, CaregiverAdherenceReport } from '@/hooks/useCaregiverData';

interface CaregiverMedicationsTabProps {
  userId: string;
  medications: CaregiverMedication[];
  adherenceData: CaregiverAdherenceReport | null;
  adherencePeriod: 'week' | 'month';
  onPeriodChange: (period: 'week' | 'month') => void;
}

export function CaregiverMedicationsTab({
  userId,
  medications,
  adherenceData,
  adherencePeriod,
  onPeriodChange,
}: CaregiverMedicationsTabProps) {
  return (
    <div className="space-y-6">
      {/* Medications List */}
      <Card title="Active Medications">
        {medications.length === 0 ? (
          <p className="text-gray-600">No active medications found.</p>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => (
              <div
                key={med.id}
                className="flex justify-between items-center border-b pb-2 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-gray-800">{med.name}</p>
                  <p className="text-sm text-gray-600">{med.dosage}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-600 font-medium">{med.time}</p>
                  <p
                    className={`text-xs ${
                      med.total_stock <= med.low_stock_threshold
                        ? 'text-red-600 font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    Stock: {med.total_stock}{' '}
                    {med.total_stock <= med.low_stock_threshold && '⚠️'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pattern Detector & Smart Adherence */}
      <AdherenceInsightsCard userId={userId} />

      {/* Refill Predictions */}
      <RefillPredictionWidget userId={userId} />

      {/* Adherence Report */}
      <Card title="Medication Adherence Report">
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => onPeriodChange('week')}
            className={`px-4 py-2 rounded text-sm font-semibold transition ${
              adherencePeriod === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange('month')}
            className={`px-4 py-2 rounded text-sm font-semibold transition ${
              adherencePeriod === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            This Month
          </button>
        </div>

        {adherenceData ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Period: {adherenceData.startDate} to {adherenceData.endDate}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {adherenceData.overall.adherenceRate}%
                  </p>
                  <p className="text-xs text-gray-600">Overall Adherence</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {adherenceData.overall.takenCount}
                  </p>
                  <p className="text-xs text-gray-600">Taken</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {adherenceData.overall.skippedCount}
                  </p>
                  <p className="text-xs text-gray-600">Skipped</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {adherenceData.overall.laterCount}
                  </p>
                  <p className="text-xs text-gray-600">Later</p>
                </div>
              </div>
            </div>

            {adherenceData.byMedication.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">By Medication</h4>
                <div className="space-y-3">
                  {adherenceData.byMedication.map((medStat) => (
                    <div
                      key={medStat.medication.id}
                      className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">
                          {medStat.medication.name}
                        </span>
                        <span
                          className={`font-bold text-sm ${
                            medStat.adherenceRate >= 80
                              ? 'text-green-600'
                              : medStat.adherenceRate >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {medStat.adherenceRate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Taken: {medStat.taken} | Skipped: {medStat.skipped} | Later: {medStat.later}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Loading adherence data...</p>
        )}
      </Card>
    </div>
  );
}
