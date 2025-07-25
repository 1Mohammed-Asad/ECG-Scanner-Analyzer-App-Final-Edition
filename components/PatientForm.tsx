
import React from 'react';
import { PatientInfo } from '../types';

interface PatientFormProps {
    patientInfo: PatientInfo;
    onFormChange: (info: PatientInfo) => void;
    disabled: boolean;
}

const inputStyles = "w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50";

const PatientForm: React.FC<PatientFormProps> = ({ patientInfo, onFormChange, disabled }) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        onFormChange({ ...patientInfo, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">Patient Information</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Patient Full Name</label>
                    <input type="text" name="name" id="name" value={patientInfo.name} onChange={handleChange} className={inputStyles} placeholder="John Doe" disabled={disabled}/>
                </div>
                <div>
                    <label htmlFor="id" className="block text-sm font-medium text-slate-300 mb-1">Patient ID</label>
                    <input type="text" name="id" id="id" value={patientInfo.id} onChange={handleChange} className={inputStyles} placeholder="e.g., MRN12345" disabled={disabled}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="age" className="block text-sm font-medium text-slate-300 mb-1">Age</label>
                        <input type="number" name="age" id="age" value={patientInfo.age} onChange={handleChange} className={inputStyles} placeholder="e.g., 45" disabled={disabled}/>
                    </div>
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-slate-300 mb-1">Gender</label>
                        <select name="gender" id="gender" value={patientInfo.gender} onChange={handleChange} className={inputStyles} disabled={disabled}>
                            <option value="" disabled>Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="symptoms" className="block text-sm font-medium text-slate-300 mb-1">Clinical Notes / Symptoms (Optional)</label>
                    <textarea 
                        name="symptoms" 
                        id="symptoms" 
                        value={patientInfo.symptoms} 
                        onChange={handleChange} 
                        className={`${inputStyles} h-24`} 
                        placeholder="e.g., Patient presents with chest pain and shortness of breath..." 
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};

export default PatientForm;