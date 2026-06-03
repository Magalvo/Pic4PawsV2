import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Camera,
  ChartNoAxesColumn,
  CirclePlus,
  Filter,
  Grid2X2,
  Heart,
  Home,
  Info,
  MapPin,
  MessageSquare,
  PawPrint,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import {
  feedPosts,
  findPetById,
  findShelterById,
  pets,
  shelters,
  sponsorshipProgress,
} from '@pic4paws/domain';

const navItems = [
  { to: '/feed', label: 'Feed', icon: Home },
  { to: '/shelter', label: 'Explore', icon: Search },
  { to: '/pets/sparky', label: 'History', icon: Heart },
  { to: '/upload', label: 'Profile', icon: User },
];

export function App() {
  return (
    <main className="app-canvas">
      <Routes>
        <Route path="/" element={<OnboardingScreen />} />
        <Route path="/feed" element={<FeedScreen />} />
        <Route path="/shelter" element={<ShelterDashboard />} />
        <Route path="/upload" element={<UploadPetScreen />} />
        <Route path="/pets/sparky" element={<PetProfileScreen />} />
      </Routes>
    </main>
  );
}

function AppHeader() {
  return (
    <header className="top-bar">
      <PawPrint className="brand-mark" aria-hidden="true" />
      <strong>Pic4Paws</strong>
      <div className="top-actions">
        <Bell aria-label="Notifications" />
        <Send aria-label="Messages" />
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className="bottom-nav__item">
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function OnboardingScreen() {
  return (
    <section className="mobile-shell onboarding-shell">
      <div className="onboarding-intro">
        <span className="logo-orb">
          <PawPrint aria-hidden="true" />
        </span>
        <h1>Pic4Paws</h1>
        <p>Connecting paws with forever homes. Choose your path to start making a difference.</p>
      </div>

      <div className="path-panel">
        <img src="/images/hero.jpg" alt="Volunteer holding a happy dog" />
        <span className="path-icon adopter">
          <Heart aria-hidden="true" />
        </span>
        <h2>Register as an Adopter</h2>
        <p>Browse local pets, connect with shelters and start the journey to a new companion.</p>
        <Link className="primary-button" to="/feed">
          Get Started
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div className="path-panel">
        <img src="/images/snowball.jpeg" alt="Shelter resident waiting for adoption" />
        <span className="path-icon shelter">
          <Building2 aria-hidden="true" />
        </span>
        <h2>Shelter / Association</h2>
        <p>Manage residents, share beautiful photos and find families through a focused platform.</p>
        <Link className="secondary-button" to="/shelter">
          Register Shelter
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function FeedScreen() {
  return (
    <section className="mobile-shell with-nav">
      <AppHeader />
      <div className="tabs" role="tablist" aria-label="Feed filters">
        <button className="is-active" type="button">
          For You
        </button>
        <button type="button">Following</button>
      </div>

      <div className="feed-list">
        {feedPosts.map((post) => {
          const pet = findPetById(post.petId);
          const shelter = findShelterById(post.shelterId);

          if (!pet || !shelter) {
            return null;
          }

          return (
            <article className="feed-post" key={post.id}>
              <header className="post-header">
                <span className="avatar">{shelter.name.slice(0, 1)}</span>
                <div>
                  <strong>{shelter.name}</strong>
                  <p>
                    {post.distanceMiles} miles away • {shelter.city}, {shelter.state}
                  </p>
                </div>
                <button className="icon-button" type="button" aria-label="Post options">
                  <Grid2X2 aria-hidden="true" />
                </button>
              </header>

              <div className="media-frame">
                <img src={pet.imageUrl} alt={`${pet.name}, ${pet.breed}`} />
                <div className="media-actions">
                  <Link className="adopt-button" to="/pets/sparky">
                    <Heart aria-hidden="true" />
                    Adopt Me
                  </Link>
                  <button className="sponsor-button" type="button">
                    <ShieldCheck aria-hidden="true" />
                    Sponsor
                  </button>
                  <button className="donate-button" type="button">
                    <Heart aria-hidden="true" />
                    Donate
                  </button>
                </div>
              </div>

              <footer className="post-footer">
                <div className="engagement-row">
                  <span>
                    <Heart aria-hidden="true" />
                    {pet.likes.toLocaleString('en-US')}
                  </span>
                  <span>
                    <MessageSquare aria-hidden="true" />
                    {pet.comments}
                  </span>
                  <Share2 aria-label="Share post" />
                </div>
                <p>
                  <strong>{shelter.name}</strong> {post.caption}
                </p>
                <button type="button">View all {pet.comments} comments</button>
              </footer>
            </article>
          );
        })}
      </div>

      <BottomNav />
    </section>
  );
}

function ShelterDashboard() {
  const shelter = shelters[0]!;

  return (
    <section className="mobile-shell with-nav dashboard-shell">
      <header className="shelter-header">
        <span className="logo-orb small">
          <PawPrint aria-hidden="true" />
        </span>
        <div>
          <h1>{shelter.name}</h1>
          <p>Shelter Partner</p>
        </div>
        <button className="outline-button" type="button">
          Edit Profile
        </button>
      </header>

      <section className="section-block">
        <h2>
          <ChartNoAxesColumn aria-hidden="true" />
          Performance Overview
        </h2>
        <div className="metric-panel">
          <p>Total Monthly Donations</p>
          <strong>$4,250</strong>
          <span>up 12%</span>
          <div className="metric-bar">
            <span />
          </div>
        </div>
        <div className="metric-panel">
          <p>Active Sponsors</p>
          <strong>128</strong>
          <span>up 5%</span>
          <div className="sponsor-stack" aria-hidden="true">
            <i />
            <i />
            <i />
            <b>+125</b>
          </div>
        </div>
      </section>

      <section className="resident-cta">
        <h2>Have a new resident?</h2>
        <p>Upload photos and details to find them a sponsor or a forever home today.</p>
        <Link className="light-button" to="/upload">
          <Camera aria-hidden="true" />
          Upload New Pet
        </Link>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Active Residents</h2>
          <div className="top-actions resident-actions">
            <button className="icon-outline" type="button" aria-label="Filter residents">
              <Filter aria-hidden="true" />
            </button>
            <button className="icon-outline" type="button" aria-label="Grid view">
              <Grid2X2 aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="chip-row">
          <button className="chip active" type="button">
            All
          </button>
          <button className="chip" type="button">
            Dogs
          </button>
          <button className="chip" type="button">
            Cats
          </button>
          <button className="chip" type="button">
            Small Pets
          </button>
        </div>
        <div className="resident-grid">
          {pets.map((pet) => (
            <article className="resident-card" key={pet.id}>
              <img src={pet.imageUrl} alt={`${pet.name}, ${pet.breed}`} />
              <span className={pet.status === 'pending' ? 'status-badge needs' : 'status-badge'}>
                {pet.status === 'pending' ? 'Needs Sponsor' : 'Sponsored'}
              </span>
              <h3>{pet.name}</h3>
              <div className="tag-list">
                {pet.tags.slice(0, 2).map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Link className="floating-action" to="/upload" aria-label="Add resident">
        <CirclePlus aria-hidden="true" />
      </Link>
      <BottomNav />
    </section>
  );
}

function UploadPetScreen() {
  return (
    <section className="mobile-shell upload-shell">
      <header className="screen-header">
        <Link to="/shelter" aria-label="Back to shelter dashboard">
          <ArrowLeft aria-hidden="true" />
        </Link>
        <h1>Upload New Pet</h1>
      </header>

      <form className="upload-form">
        <label className="eyebrow">Pet Photo</label>
        <button className="dropzone" type="button">
          <span>
            <Camera aria-hidden="true" />
          </span>
          <strong>Tap to add photo</strong>
          <small>JPG, PNG up to 10MB</small>
          <b>Choose File</b>
        </button>

        <label>
          Pet Name
          <input placeholder="e.g. Buddy" />
        </label>
        <div className="form-grid">
          <label>
            Pet Type
            <select defaultValue="">
              <option value="" disabled>
                Select Type
              </option>
              <option>Dog</option>
              <option>Cat</option>
              <option>Rabbit</option>
            </select>
          </label>
          <label>
            Age
            <input placeholder="e.g. 2 years" />
          </label>
        </div>
        <label>
          Breed
          <input placeholder="e.g. Golden Retriever" />
        </label>

        <div className="section-heading compact">
          <span className="eyebrow teal">Traits & Tags</span>
          <button type="button">
            <CirclePlus aria-hidden="true" />
            Add New
          </button>
        </div>
        <div className="tag-picker">
          {['GoodWithCats', 'HighEnergy', 'HouseTrained', 'KidFriendly', 'Calm'].map((tag, index) => (
            <button className={index < 3 ? 'selected' : ''} key={tag} type="button">
              #{tag}
            </button>
          ))}
        </div>

        <label>
          About Me
          <textarea placeholder="Tell us about the pet's personality, history and needs..." />
        </label>

        <button className="publish-button" type="submit">
          <Upload aria-hidden="true" />
          Publish to Feed
        </button>
        <button className="draft-button" type="button">
          Save Draft
        </button>
      </form>
    </section>
  );
}

function PetProfileScreen() {
  const pet = pets[0]!;
  const shelter = findShelterById(pet.shelterId)!;
  const progress = sponsorshipProgress(pet.sponsorship);

  return (
    <section className="mobile-shell profile-shell">
      <header className="screen-header floating">
        <Link to="/feed" aria-label="Back to feed">
          <ArrowLeft aria-hidden="true" />
        </Link>
        <h1>Sparky's Profile</h1>
        <div className="top-actions">
          <Share2 aria-label="Share pet" />
          <Heart aria-label="Save pet" />
        </div>
      </header>

      <section className="profile-hero">
        <img src={pet.imageUrl} alt={`${pet.name}, ${pet.breed}`} />
        <div>
          <span>Available for Adoption</span>
          <h2>Sparky</h2>
          <p>
            {pet.breed} • {pet.age}
          </p>
        </div>
      </section>

      <div className="profile-content">
        <section className="location-panel">
          <span>
            <MapPin aria-hidden="true" />
          </span>
          <div>
            <p>Current Shelter</p>
            <strong>
              {shelter.name}, {shelter.city}
            </strong>
          </div>
        </section>

        <section className="section-block">
          <h2>
            <Info aria-hidden="true" />
            About Me
          </h2>
          <p className="copy-panel">
            Hi there. I am Sparky, and volunteers say I have a sparkling personality. I love
            belly rubs, playing fetch in the water and making new friends. I am looking for a
            forever home where I can share my endless supply of love.
          </p>
        </section>

        <section className="sponsorship-panel">
          <div>
            <h2>
              <Heart aria-hidden="true" />
              Sponsorship Goals
            </h2>
            <strong>{progress}%</strong>
          </div>
          <p>{pet.sponsorship.label}</p>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <small>
            ${pet.sponsorship.currentAmount} of ${pet.sponsorship.targetAmount} covered this month.
            Sponsorship helps provide food and regular vet checkups.
          </small>
        </section>

        <div className="medical-grid">
          <MedicalTile icon="kit" label="Vaccinated" value="Up to Date" />
          <MedicalTile icon="sterile" label="Sterilized" value="Yes" />
          <MedicalTile icon="paw" label="Energy Level" value="High" />
        </div>
      </div>

      <div className="profile-actions">
        <button className="sponsor-button" type="button">
          <Heart aria-hidden="true" />
          Sponsor
        </button>
        <button className="adopt-button" type="button">
          <Home aria-hidden="true" />
          Adopt Me
        </button>
      </div>
    </section>
  );
}

function MedicalTile({ label, value }: { icon: 'kit' | 'sterile' | 'paw'; label: string; value: string }) {
  const Icon = PawPrint;

  return (
    <article className="medical-tile">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
