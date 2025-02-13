// DraggableDirective.js
export default {
    mounted(el) {
      // Ensure the element is positioned so it can be moved
      el.style.position = 'absolute';
  
      let pos = { top: 0, left: 0, x: 0, y: 0 };
  
      const mouseDownHandler = function(e) {
        // Check if the clicked element (or any of its parents) should not trigger drag
        if (e.target.closest('.no-drag')) {
          // If the target is inside an element with the "no-drag" class, do nothing
          return;
        }
  
        // Otherwise, begin dragging
        pos = {
          left: el.offsetLeft,
          top: el.offsetTop,
          x: e.clientX,
          y: e.clientY,
        };
  
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
      };
  
      const mouseMoveHandler = function(e) {
        // Calculate the new position
        const dx = e.clientX - pos.x;
        const dy = e.clientY - pos.y;
        el.style.left = pos.left + dx + 'px';
        el.style.top = pos.top + dy + 'px';
      };
  
      const mouseUpHandler = function() {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };
  
      el.addEventListener('mousedown', mouseDownHandler);
  
      // Save handler references for later cleanup
      el._draggable = {
        mouseDownHandler,
        mouseMoveHandler,
        mouseUpHandler,
      };
    },
    unmounted(el) {
      const { mouseDownHandler, mouseMoveHandler, mouseUpHandler } = el._draggable || {};
      el.removeEventListener('mousedown', mouseDownHandler);
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    },
  };
  