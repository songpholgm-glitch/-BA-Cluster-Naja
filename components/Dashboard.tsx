import React from 'react';
import { BaAggregatedData, AnalysisResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';
import { Sparkles, Users, TrendingUp, Target } from 'lucide-react';

interface DashboardProps {
  data: BaAggregatedData[];
  analysis: AnalysisResult;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, analysis }) => {
  // Enrich data with cluster info
  const enrichedData = data.map(item => {
    const assignment = analysis.assignments.find(a => a.baId === item.baId);
    const clusterDef = analysis.clusters.find(c => c.name === assignment?.clusterName);
    return {
      ...item,
      clusterName: assignment?.clusterName || 'ไม่ระบุกลุ่ม',
      clusterColor: clusterDef?.color || '#cccccc'
    };
  });

  // Calculate summary per cluster
  const clusterStats = analysis.clusters.map(cluster => {
    const clusterItems = enrichedData.filter(d => d.clusterName === cluster.name);
    const count = clusterItems.length;
    const avgTotalSpend = count > 0 ? clusterItems.reduce((sum, item) => sum + item.totalAmount, 0) / count : 0;
    return {
      ...cluster,
      count,
      avgTotalSpend
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Cluster Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {clusterStats.map((cluster, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: cluster.color }}></div>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-gray-800">{cluster.name}</h3>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-mono">
                {cluster.count} ราย
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{cluster.description}</p>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <TrendingUp className="w-4 h-4" />
              <span>ยอดเฉลี่ย: ฿{cluster.avgTotalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scatter Plot: Transaction Count vs Total Amount */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">การวิเคราะห์การกระจายตัว (Distribution)</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" dataKey="transactionCount" name="Transactions" unit="" label={{ value: 'จำนวนครั้งที่ซื้อ', position: 'bottom', offset: 0 }} />
                <YAxis type="number" dataKey="totalAmount" name="Total Spend" unit="฿" label={{ value: 'ยอดซื้อรวม', angle: -90, position: 'insideLeft' }} />
                <ZAxis type="number" range={[60, 60]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border shadow-lg rounded text-sm z-50">
                          <p className="font-bold mb-1 text-gray-800">BA: {d.baId}</p>
                          <p className="text-gray-600">กลุ่ม: <span style={{color: d.clusterColor, fontWeight: 'bold'}}>{d.clusterName}</span></p>
                          <p className="text-gray-600">ยอดรวม: <span className="font-mono text-gray-900">฿{d.totalAmount.toLocaleString()}</span></p>
                          <p className="text-gray-600">จำนวนบิล: <span className="font-mono text-gray-900">{d.transactionCount}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {analysis.clusters.map((cluster) => (
                   <Scatter 
                      key={cluster.name} 
                      name={cluster.name} 
                      data={enrichedData.filter(d => d.clusterName === cluster.name)} 
                      fill={cluster.color}
                   />
                ))}
                <Legend verticalAlign="top" height={36}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">แกน X: จำนวนธุรกรรม | แกน Y: ยอดใช้จ่ายรวม</p>
        </div>

        {/* Bar Chart: Average Spend per Cluster */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-800">เปรียบเทียบมูลค่าของแต่ละกลุ่ม</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clusterStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip 
                   formatter={(value: number) => [`฿${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`, 'ยอดใช้จ่ายเฉลี่ย']}
                   cursor={{fill: '#f9fafb'}}
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="avgTotalSpend" name="ยอดใช้จ่ายเฉลี่ย" radius={[4, 4, 0, 0]}>
                  {clusterStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">ยอดใช้จ่ายรวมเฉลี่ยต่อคน ในแต่ละกลุ่ม</p>
        </div>

      </div>
      
      {/* Data Table Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 font-medium text-gray-700 flex justify-between items-center">
           <span>ตัวอย่างข้อมูล (10 อันดับแรก)</span>
           <Sparkles className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">BA ID</th>
                <th className="px-6 py-3">กลุ่ม (Cluster)</th>
                <th className="px-6 py-3 text-right">ยอดซื้อรวม</th>
                <th className="px-6 py-3 text-right">จำนวนบิล</th>
                <th className="px-6 py-3 text-right">ยอดเฉลี่ย/บิล</th>
              </tr>
            </thead>
            <tbody>
              {enrichedData
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 10)
                .map((item) => (
                <tr key={item.baId} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.baId}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs font-medium border" style={{ color: item.clusterColor, borderColor: item.clusterColor, backgroundColor: `${item.clusterColor}10` }}>
                      {item.clusterName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">฿{item.totalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                  <td className="px-6 py-4 text-right">{item.transactionCount}</td>
                  <td className="px-6 py-4 text-right">฿{item.averageAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};