// 教室タグ定義
// 各教室のIDと表示名を管理

export const SCHOOLS = [
    { id: 'aizumi-jr', name: '藍住ジュニア', location: '藍住', type: 'junior', color: '#FF6B9D' },
    { id: 'aizumi-bo', name: '藍住ベストワン', location: '藍住', type: 'bestone', color: '#FF8FAB' },
    { id: 'kitajima-jr', name: '北島中央ジュニア', location: '北島中央', type: 'junior', color: '#4ECDC4' },
    { id: 'kitajima-bo', name: '北島中央ベストワン', location: '北島中央', type: 'bestone', color: '#7EDAD3' },
    { id: 'daigakumae-jr', name: '大学前ジュニア', location: '大学前', type: 'junior', color: '#FFB347' },
    { id: 'itano-jr', name: '板野駅前ジュニア', location: '板野駅前', type: 'junior', color: '#B19CD9' }
];

// ロケーション（教室）グループ
export const LOCATIONS = [
    { id: 'aizumi', name: '藍住', schools: ['aizumi-jr', 'aizumi-bo'] },
    { id: 'kitajima', name: '北島中央', schools: ['kitajima-jr', 'kitajima-bo'] },
    { id: 'daigakumae', name: '大学前', schools: ['daigakumae-jr'] },
    { id: 'itano', name: '板野駅前', schools: ['itano-jr'] }
];

// ヘルパー関数
export function getSchoolById(id) {
    return SCHOOLS.find(s => s.id === id);
}

export function getSchoolName(id) {
    const school = getSchoolById(id);
    return school ? school.name : id;
}

export function getSchoolColor(id) {
    const school = getSchoolById(id);
    return school ? school.color : '#999';
}
