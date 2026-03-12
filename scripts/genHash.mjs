import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('TempTest123x', 12);
console.log(hash);
