import React from 'react';
// FIX: Changed HospitalData to StateData to match the updated types.
import { type StateData } from '../types';

interface MapProps {
    // FIX: Changed hospitalData prop to use StateData type.
    hospitalData: StateData[];
    highlightedDistrict: string | null;
}

// FIX: Changed parameter to accept StateData type.
const getOccupancyRate = (stateData: StateData) => {
    const icuOccupied = stateData.icuBeds.occupied;
    const icuTotal = stateData.icuBeds.total;
    if (icuTotal === 0) return 0;
    return (icuOccupied / icuTotal) * 100;
};

const getColorForOccupancy = (rate: number) => {
    if (rate > 90) return 'fill-red-500 hover:fill-red-600';
    if (rate > 75) return 'fill-orange-500 hover:fill-orange-600';
    if (rate > 50) return 'fill-yellow-400 hover:fill-yellow-500';
    return 'fill-green-500 hover:fill-green-600';
};


// A mock SVG path for each Indian district/major city
const districtPaths: { [key: string]: string } = {
    'Delhi': "M85 10 H 115 V 40 H 85 Z",
    'Mumbai': "M10 80 H 40 V 110 H 10 Z",
    'Kolkata': "M160 80 H 190 V 110 H 160 Z",
    'Bengaluru': "M80 140 H 120 V 170 H 80 Z",
    'Chennai': "M130 150 H 160 V 180 H 130 Z"
};

// FIX: Map major cities to their respective states to find data, as the dataset is now at the state level.
const cityToStateMap: { [key: string]: string } = {
    'Delhi': 'Delhi',
    'Mumbai': 'Maharashtra',
    'Kolkata': 'West Bengal',
    'Bengaluru': 'Karnataka',
    'Chennai': 'Tamil Nadu',
};


const MapVisualization: React.FC<MapProps> = ({ hospitalData, highlightedDistrict }) => {
    // FIX: Create a map of state data keyed by state name for efficient lookup.
    const stateDataMap: { [key: string]: StateData } = {};
    hospitalData.forEach(s => {
        stateDataMap[s.name] = s;
    });

    const getCoords = (district: string): { x: number, y: number, textY: number } => {
        switch (district) {
            case 'Delhi': return { x: 100, y: 25, textY: 35 };
            case 'Mumbai': return { x: 25, y: 95, textY: 105 };
            case 'Kolkata': return { x: 175, y: 95, textY: 105 };
            case 'Bengaluru': return { x: 100, y: 155, textY: 165 };
            case 'Chennai': return { x: 145, y: 165, textY: 175 };
            default: return { x: 0, y: 0, textY: 0 };
        }
    };


    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
             <svg viewBox="0 0 200 200" className="w-full h-auto max-h-[280px]">
                {Object.keys(districtPaths).map(districtName => {
                    // FIX: Use cityToStateMap to find the correct state data for the city.
                    const stateName = cityToStateMap[districtName];
                    const data = stateDataMap[stateName];
                    if (!data) return null;

                    const occupancy = getOccupancyRate(data);
                    const colorClass = getColorForOccupancy(occupancy);
                    const isHighlighted = highlightedDistrict === districtName;
                    const { x, y } = getCoords(districtName);

                    return (
                        <g key={districtName}>
                             <path
                                d={districtPaths[districtName]}
                                className={`${colorClass} stroke-white stroke-2 transition-all duration-300 ${isHighlighted ? 'transform scale-110' : ''}`}
                                style={{ transformOrigin: 'center center' }}
                            />
                            <text x={x} y={y - 5} textAnchor="middle" className="fill-slate-700 font-bold text-[8px] sm:text-[10px] pointer-events-none">
                                {districtName}
                            </text>
                            <text x={x} y={y + 8} textAnchor="middle" className="fill-white font-semibold text-[8px] pointer-events-none">
                                {occupancy.toFixed(0)}% ICU
                            </text>
                        </g>
                    );
                })}
            </svg>
             <div className="flex justify-center items-center space-x-4 mt-2 text-xs text-slate-600">
                <div className="flex items-center space-x-1"><div className="w-3 h-3 rounded-sm bg-green-500"></div><span>Normal (&lt;50%)</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-3 rounded-sm bg-yellow-400"></div><span>High (50-75%)</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-3 rounded-sm bg-orange-500"></div><span>Severe (75-90%)</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-3 rounded-sm bg-red-500"></div><span>Critical (&gt;90%)</span></div>
            </div>
        </div>
    );
};

export default MapVisualization;
