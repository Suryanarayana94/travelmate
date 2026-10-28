import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

const NotFound = ({ embedded = false }) => (
  <div className={embedded ? 'embedded-404' : 'notfound-page'}>
    <Compass size={46} />
    <h1>This path isn’t on the map</h1>
    <p>The page you’re looking for may have moved. Let’s get you back to planning.</p>
    <Link to="/" className="btn btn-primary"><ArrowLeft size={16} /> Back home</Link>
  </div>
);

export default NotFound;
