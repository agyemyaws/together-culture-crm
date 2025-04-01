import { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import api from '../../api';

// Helper function to get default image based on content type and category
const getDefaultImageUrl = (type, category) => {
  // Map of content types and categories to relevant unsplash images
  const imageMap = {
    course: {
      Leadership: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop&q=80",
      Marketing: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=600&h=400&fit=crop&q=80",
      Community: "https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=600&h=400&fit=crop&q=80",
      default: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop&q=80",
    },
    template: {
      Events: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop&q=80",
      default: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=400&fit=crop&q=80",
    },
    webinar: {
      Community: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=400&fit=crop&q=80",
      default: "https://images.unsplash.com/photo-1591115765373-5207764f72e4?w=600&h=400&fit=crop&q=80",
    },
    article: {
      default: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop&q=80",
    },
    video: {
      default: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&h=400&fit=crop&q=80",
    },
    ebook: {
      default: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop&q=80",
    },
    podcast: {
      default: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=600&h=400&fit=crop&q=80",
    },
    default: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop&q=80",
  };

  // Return the specific image for the type and category, or fall back to defaults
  return imageMap[type]?.[category] || imageMap[type]?.default || imageMap.default;
};

// Helper function to generate default URL based on content type
const getDefaultContentUrl = (type, title) => {
  const formattedTitle = title.toLowerCase().replace(/\s+/g, '-');
  
  const urlMap = {
    course: `https://learn.example.com/courses/${formattedTitle}`,
    template: `https://resources.example.com/templates/${formattedTitle}`,
    webinar: `https://webinars.example.com/watch/${formattedTitle}`,
    article: `https://blog.example.com/articles/${formattedTitle}`,
    video: `https://videos.example.com/watch/${formattedTitle}`,
    ebook: `https://resources.example.com/ebooks/${formattedTitle}`,
    podcast: `https://podcasts.example.com/episodes/${formattedTitle}`,
    default: `https://content.example.com/${formattedTitle}`,
  };

  return urlMap[type] || urlMap.default;
};

const ContentManagement = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [contentFormData, setContentFormData] = useState({
    title: '',
    description: '',
    content_type: 'course',
    category: 'Other',
    access_level: 'all',
    author: '',
    duration: '',
    image_url: '',
    rating: '',
    url: '',
  });

  // Fetch all digital content
  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await api.get('/content/content/');
      setContent(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load digital content. ' + 
      (error.response?.data?.detail || error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleCreateContent = () => {
    setCurrentContent(null);
    setContentFormData({
      title: '',
      description: '',
      content_type: 'course',
      category: 'Other',
      access_level: 'all',
      author: '',
      duration: '',
      image_url: '',
      rating: '',
      url: '',
    });
    setIsModalOpen(true);
  };

  const handleEditContent = (contentItem) => {
    setCurrentContent(contentItem);
    setContentFormData({
      title: contentItem.title,
      description: contentItem.description || '',
      content_type: contentItem.content_type,
      category: contentItem.category,
      access_level: contentItem.access_level,
      author: contentItem.author || '',
      duration: contentItem.duration || '',
      image_url: contentItem.image_url || '',
      rating: contentItem.rating || '',
      url: contentItem.url || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteContent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      await api.delete(`/content/content/${id}/`);
      setContent(prevContent => prevContent.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting content:', error);
      setError('Failed to delete content. ' + 
      (error.response?.data?.detail || error.message || ''));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContentFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      const formData = { ...contentFormData };
      
      // Convert rating to number if it exists
      if (formData.rating) {
        formData.rating = parseFloat(formData.rating);
      }
      
      // Set default image URL if left blank
      if (!formData.image_url.trim()) {
        formData.image_url = getDefaultImageUrl(formData.content_type, formData.category);
      }
      
      // Set default content URL if left blank
      if (!formData.url.trim()) {
        formData.url = getDefaultContentUrl(formData.content_type, formData.title);
      }
      
      if (currentContent) {
        // Edit existing content
        response = await api.put(`/content/content/${currentContent.id}/`, formData);
        setContent(prevContent => 
          prevContent.map(item => item.id === currentContent.id ? response.data : item)
        );
      } else {
        // Create new content
        response = await api.post('/content/content/', formData);
        setContent(prevContent => [...prevContent, response.data]);
      }
      
      setIsModalOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error saving content:', error);
      setError('Failed to save content. ' + 
      (error.response?.data?.detail || error.message || ''));
    }
  };

  return (
    <div>
      <div className={styles.managementHeader}>
        <h2>Digital Content Management</h2>
        <button 
          className={styles.addButton}
          onClick={handleCreateContent}
        >
          Add New Content
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {loading ? (
        <div className={styles.loadingIndicator}>Loading content...</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Category</th>
              <th>Access Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {content.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.emptyMessage}>
                  No digital content found. Create your first content.
                </td>
              </tr>
            ) : (
              content.map(item => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.content_type}</td>
                  <td>{item.category}</td>
                  <td>{item.access_level}</td>
                  <td className={styles.actionButtons}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEditContent(item)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteContent(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Content Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{currentContent ? 'Edit Content' : 'Add New Content'}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={contentFormData.title}
                  onChange={handleInputChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={contentFormData.description}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows="4"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="content_type">Content Type *</label>
                  <select
                    id="content_type"
                    name="content_type"
                    value={contentFormData.content_type}
                    onChange={handleInputChange}
                    required
                    className={styles.select}
                  >
                    <option value="course">Course</option>
                    <option value="template">Template</option>
                    <option value="webinar">Webinar</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={contentFormData.category}
                    onChange={handleInputChange}
                    required
                    className={styles.select}
                  >
                    <option value="Leadership">Leadership</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Community">Community</option>
                    <option value="Events">Events</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="access_level">Access Level *</label>
                  <select
                    id="access_level"
                    name="access_level"
                    value={contentFormData.access_level}
                    onChange={handleInputChange}
                    required
                    className={styles.select}
                  >
                    <option value="all">All Members</option>
                    <option value="community">Community Members</option>
                    <option value="key_access">Key Access Members</option>
                    <option value="creative_workspace">Creative Workspace Members</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="author">Author</label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={contentFormData.author}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="duration">Duration</label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={contentFormData.duration}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="e.g. 2 hours, 45 min"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="rating">Rating (1-5)</label>
                  <input
                    type="number"
                    id="rating"
                    name="rating"
                    value={contentFormData.rating}
                    onChange={handleInputChange}
                    className={styles.input}
                    min="1"
                    max="5"
                    step="0.1"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="image_url">Image URL <small>(Leave blank for auto-generated URL)</small></label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={contentFormData.image_url}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="url">Content URL <small>(Leave blank for auto-generated URL)</small></label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={contentFormData.url}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="https://example.com/your-content"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={contentFormData.featured}
                    onChange={handleInputChange}
                  />
                  Featured Content
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {currentContent ? 'Update Content' : 'Create Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement; 