const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const fs = require('fs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'sync_secret_key',
    resave: false,
    saveUninitialized: true
}));

const ADMINS = [
  { username: 'hr@synclogics.xyz', password: 'w5uZCq@#H?' },
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/apply', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apply.html'));
});

app.get('/apply-developer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apply', 'apply-developer.html'));
});
app.get('/apply-management', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apply', 'apply-management.html'));
});
app.get('/apply-support', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apply', 'apply-support.html'));
});
app.get('/apply-moderator', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apply', 'apply-moderator.html'));
});
app.get('/apply-marketing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apply', 'apply-marketing.html'));
});

app.post('/submit-application', (req, res) => {
    const { type, name, email, skills, handle, past, experience, discord } = req.body;
    const id = Date.now().toString() + Math.floor(Math.random() * 1000);
    
    const newApp = {
        id,
        type,
        name,
        email,
        skills,
        handle,
        past,
        experience,
        discord,
        status: 'pending'
    };

    try {
        let apps = [];

        if (fs.existsSync('applications.json')) {
            const fileData = fs.readFileSync('applications.json', 'utf8');
            try {
                const parsed = JSON.parse(fileData);
                if (Array.isArray(parsed)) {
                    apps = parsed;
                } else {
                    apps = [];
                }
            } catch (parseErr) {
                console.warn("Invalid JSON, starting with empty array.");
                apps = [];
            }
        }

        apps.push(newApp);
        fs.writeFileSync('applications.json', JSON.stringify(apps, null, 2));
        res.redirect('/success.html');

    } catch (err) {
        console.error("Error saving application:", err);
        res.status(500).send('Something went wrong. Please try again later.');
    }
});
app.get('/apply/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apply', 'admin-login.html'));
});

app.post('/apply/admin/login', (req, res) => {
    const { username, password } = req.body;

    const found = ADMINS.find(u => u.username === username && u.password === password);
    if (found) {
        req.session.admin = true;
        res.redirect('/apply/admin/panel');
    } else {
        const errorMessage = encodeURIComponent('Ongeldige gebruikersnaam of wachtwoord.');
        res.redirect('/apply/admin?error=' + errorMessage);
    }
});

app.get('/apply/admin/panel', (req, res) => {
    if (req.session && req.session.admin) {
        res.sendFile(path.join(__dirname, 'public', 'apply', 'admin-panel.html'));
    } else {
        res.redirect('/apply/admin');
    }
});

app.get('/apply/admin/data', (req, res) => {
    if (req.session && req.session.admin) {
        let apps = [];
        if (fs.existsSync('applications.json')) {
            apps = JSON.parse(fs.readFileSync('applications.json'));
        }
        res.json(apps);
    } else {
        res.status(403).json([]);
    }
});

app.get('/apply/admin/data/:id', (req, res) => {
    if (req.session && req.session.admin) {
        const { id } = req.params;
        let apps = [];
        if (fs.existsSync('applications.json')) {
            apps = JSON.parse(fs.readFileSync('applications.json'));
        }
        const found = apps.find(app => app.id === id);
        if (found) {
            res.json(found);
        } else {
            res.status(404).json({ error: 'Application not found' });
        }
    } else {
        res.status(403).json({ error: 'Not authorized' });
    }
});

app.post('/apply/admin/update', (req, res) => {
    if (req.session && req.session.admin) {
        const { id, status } = req.body;
        let apps = [];
        if (fs.existsSync('applications.json')) {
            apps = JSON.parse(fs.readFileSync('applications.json'));
        }
        apps = apps.map(app => app.id === id ? { ...app, status } : app);
        fs.writeFileSync('applications.json', JSON.stringify(apps, null, 2));
        res.json({ success: true });
    } else {
        res.status(403).json({ success: false });
    }
});

app.post('/apply/admin/delete', (req, res) => {
    if (req.session && req.session.admin) {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Missing application ID' });
        }

        let apps = [];

        if (fs.existsSync('applications.json')) {
            const fileData = fs.readFileSync('applications.json', 'utf8');
            try {
                const parsed = JSON.parse(fileData);
                if (Array.isArray(parsed)) {
                    apps = parsed;
                }
            } catch (err) {
                console.error("Error parsing applications.json:", err);
                return res.status(500).json({ success: false, message: 'Invalid data file' });
            }
        }

        const updatedApps = apps.filter(app => app.id !== id);
        fs.writeFileSync('applications.json', JSON.stringify(updatedApps, null, 2));

        res.json({ success: true });
    } else {
        res.status(403).json({ success: false, message: 'Not authorized' });
    }
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(3000, () => {
    console.log(`Server running on port 3000`);
});
