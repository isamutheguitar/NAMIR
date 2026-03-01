import { parseNamMetadata } from './src/utils/namParser.js';
import { parseIrMetadata } from './src/utils/irParser.js';
import { analyzeFile } from './src/utils/analysis.js';

console.log('--- NAM Analysis Test ---');
const dummyNamValid = JSON.stringify({
    metadata: { gear_make: 'Fender', gear_model: 'Deluxe Reverb', modeled_by: 'John Doe', gear_type: 'amp' }
});

const dummyNamInvalid = JSON.stringify({
    metadata: { gear_make: 'tz-make', gear_model: 'tz-model', modeled_by: 'author', gear_type: 'amp' }
});

console.log('NAM Valid:', parseNamMetadata(dummyNamValid, 'valid.nam'));
console.log('NAM Invalid (Extract from filename):', parseNamMetadata(dummyNamInvalid, 'JCM-800_lead.nam'));

console.log('\n--- IR Analysis Test ---');
const filenames = [
    'Celestion_V30_SM57_Cone_1in.wav',
    'Marshall_Greenback_MD421_Edge.wav',
    'Royer121_Cap_05in.wav',
    '5150_Cab_AT3035_Edge.wav',
    'MesaOS_R121_Fredman.wav'
];
filenames.forEach(fn => {
    console.log(`Filename: ${fn}`, parseIrMetadata(fn));
});

console.log('\n--- Full Analysis Test ---');
console.log('Test 1 (JCM800):', analyzeFile('Marshall JCM800 KLON CEN Cab Marshall 1960BV On SM57x2 48000.nam', dummyNamInvalid, 'NA'));
console.log('Test 2 (5150):', analyzeFile('5150 and Diezel 412 combo.nam', dummyNamInvalid, 'NA'));
console.log('Test 3 (AT3035 IR):', analyzeFile('5150_Cab_AT3035_Edge.wav', undefined, 'NA'));
