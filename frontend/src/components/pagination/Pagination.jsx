import styles from "./Pagination.module.css";
import Button from "../button/Button";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = false,
  maxVisiblePages = 5,
}) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    if (!showPageNumbers || totalPages <= 1) return null;

    const pageButtons = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageButtons.push(
        <Button
          key="first"
          variant={1 === currentPage ? "primary" : "secondary"}
          onClick={() => onPageChange(1)}
          className={styles.pageButton}
        >
          1
        </Button>
      );

      if (startPage > 2) {
        pageButtons.push(
          <span key="ellipsis1" className={styles.ellipsis}>
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <Button
          key={i}
          variant={i === currentPage ? "primary" : "secondary"}
          onClick={() => onPageChange(i)}
          className={styles.pageButton}
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtons.push(
          <span key="ellipsis2" className={styles.ellipsis}>
            ...
          </span>
        );
      }

      pageButtons.push(
        <Button
          key="last"
          variant={totalPages === currentPage ? "primary" : "secondary"}
          onClick={() => onPageChange(totalPages)}
          className={styles.pageButton}
        >
          {totalPages}
        </Button>
      );
    }

    return <div className={styles.pageNumbers}>{pageButtons}</div>;
  };

  return (
    <div className={styles.pagination}>
      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={styles.navButton}
      >
        <FaChevronLeft />
      </Button>

      {showPageNumbers ? (
        renderPageNumbers()
      ) : (
        <span className={styles.paginationInfo}>
          Strona {currentPage} z {totalPages}
        </span>
      )}

      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={styles.navButton}
      >
        <FaChevronRight />
      </Button>
    </div>
  );
};

export default Pagination;
